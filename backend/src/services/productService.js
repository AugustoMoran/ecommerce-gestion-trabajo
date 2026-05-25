const Product = require('../models/Product');
const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');

const getProducts = async ({ page = 1, limit = 12, categoria, search, sort, sinStock, currency, exchangeRate }) => {

  // --- Validación y limpieza de parámetros ---
  let cleanPage = parseInt(page) || 1;
  // Aumentar límite máximo a 10000 para admin/presupuestos (de 100 a 10000)
  let cleanLimit = Math.max(1, Math.min(parseInt(limit) || 12, 10000));
  let cleanCategoria = (typeof categoria === 'string') ? categoria.trim() : '';
  let cleanSearch = (typeof search === 'string') ? search.trim() : '';
  let cleanSort = (typeof sort === 'string') ? sort.trim() : 'newest';
  let cleanCurrency = (typeof currency === 'string') ? currency.trim().toUpperCase() : 'ARS';
  let cleanSinStock = sinStock === 'true' || sinStock === true;
  let cleanExchangeRate = Number(exchangeRate);
  if (!Number.isFinite(cleanExchangeRate) || cleanExchangeRate <= 0) cleanExchangeRate = 1000;
  if (!['USD', 'ARS'].includes(cleanCurrency)) cleanCurrency = 'ARS';

  // --- Construcción de query robusta ---
  const query = { isActive: true, deletedAt: null };
  if (cleanCategoria && cleanCategoria !== '' && cleanCategoria !== 'todas' && cleanCategoria !== 'null' && cleanCategoria !== 'undefined') {
    query.categoria = cleanCategoria;
  }
  // Solo usar $text si la búsqueda tiene al menos 2 caracteres
  if (cleanSearch.length >= 2) {
    query.$text = { $search: cleanSearch };
  }
  if (cleanSinStock) {
    query.stock = { $lte: 0 };
  } else if (cleanCategoria && cleanCategoria !== '' && cleanCategoria !== 'todas' && cleanCategoria !== 'null' && cleanCategoria !== 'undefined') {
    // Si se filtra por categoría específica, mostrar solo productos con stock > 0
    query.stock = { $gt: 0 };
  }
  // Si es 'todas' o vacío, no filtrar por stock (mostrar todos los productos activos)

  // --- Ordenamiento robusto ---
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    popular: { vendidos: -1 },
  };
  const sortBy = sortOptions[cleanSort] || sortOptions['newest'];

  const buildSortPriceExpression = () => {
    const rate = cleanExchangeRate;

    const usdCandidates = [
      '$priceOfferUSD',
      '$priceUSD',
      { $divide: [{ $ifNull: ['$precioOferta', 0] }, rate] },
      { $divide: [{ $ifNull: ['$precio', 0] }, rate] },
      { $divide: [{ $ifNull: ['$priceOfferPesos', 0] }, rate] },
      { $divide: [{ $ifNull: ['$pricePesos', 0] }, rate] },
    ];

    const arsCandidates = [
      '$priceOfferPesos',
      '$pricePesos',
      '$precioOferta',
      '$precio',
      { $multiply: [{ $ifNull: ['$priceOfferUSD', 0] }, rate] },
      { $multiply: [{ $ifNull: ['$priceUSD', 0] }, rate] },
    ];

    const candidates = cleanCurrency === 'USD' ? usdCandidates : arsCandidates;

    return {
      $let: {
        vars: {
          candidates,
        },
        in: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$$candidates',
                    as: 'price',
                    cond: { $gt: ['$$price', 0] },
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    };
  };

  // --- Logs para depuración ---
  // console.log('[getProducts] Query:', query, 'Sort:', sortBy, 'Page:', cleanPage, 'Limit:', cleanLimit);

  const total = await Product.countDocuments(query);
  let products;

  if (cleanSort === 'price-asc' || cleanSort === 'price-desc') {
    const direction = cleanSort === 'price-asc' ? 1 : -1;

    products = await Product.aggregate([
      { $match: query },
      {
        $addFields: {
          sortPrice: buildSortPriceExpression(),
        },
      },
      { $sort: { sortPrice: direction, createdAt: -1 } },
      { $skip: (cleanPage - 1) * cleanLimit },
      { $limit: cleanLimit },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoria',
          foreignField: '_id',
          as: 'categoria',
        },
      },
      {
        $unwind: {
          path: '$categoria',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          sortPrice: 0,
          'categoria.__v': 0,
          'categoria.createdAt': 0,
          'categoria.updatedAt': 0,
        },
      },
    ]);
  } else {
    products = await Product.find(query)
      .populate('categoria', 'nombre')
      .sort(sortBy)
      .skip((cleanPage - 1) * cleanLimit)
      .limit(cleanLimit)
      .lean();
  }

  return {
    products,
    page: cleanPage,
    pages: Math.ceil(total / cleanLimit),
    total,
  };
};

const getProductById = async (id) => {
  console.log(`[DEBUG] getProductById called with id: ${id}`);
  const product = await Product.findOne({ _id: id, isActive: true });
  console.log(`[DEBUG] Query result:`, product ? `Found - ${product.nombre}` : 'Not found');
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  return product;
};

const getRelatedProducts = async (productId, categoriaId, limit = 4) => {
  return Product.find({
    _id: { $ne: productId },
    categoria: categoriaId,
    isActive: true,
  })
    .limit(limit)
    .lean();
};

const sanitizeProductData = (data) => {
  const clean = { ...data };
  // Mantener todos los campos de precios
  if (!clean.categoria) delete clean.categoria;
  if (!clean.descripcion) clean.descripcion = '';
  if (!clean.precioOferta) clean.precioOferta = null;
  if (!clean.priceOfferUSD) clean.priceOfferUSD = null;
  if (!clean.priceOfferPesos) clean.priceOfferPesos = null;
  // Asegurar que al menos uno de los campos de precio esté presente
  if (!clean.priceUSD && !clean.pricePesos && !clean.precio) {
    throw Object.assign(new Error('Al menos un precio (USD o ARS) es requerido.'), { statusCode: 400 });
  }
  // Si incluye instalación pero no tiene zonas, asignar AMBA y CABA por defecto
  if (clean.hasInstallation && (!clean.installationZones || clean.installationZones.length === 0)) {
    clean.installationZones = ['AMBA', 'CABA'];
  }
  return clean;
};

const createProduct = async (data) => {
  const product = await Product.create(sanitizeProductData(data));
  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, sanitizeProductData(data), { new: true, runValidators: true });
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  // Delete images and videos from Cloudinary
  for (const img of product.imagenes) {
    await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }
  for (const vid of product.videos) {
    await cloudinary.uploader.destroy(vid.publicId, { resource_type: 'video' }).catch(() => {});
  }

  await product.softDelete();
};

const addProductImage = async (productId, url, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  if (product.imagenes.length >= 7) {
    throw Object.assign(new Error('Máximo 7 imágenes por producto.'), { statusCode: 400 });
  }
  product.imagenes.push({ url, publicId });
  return product.save();
};

const removeProductImage = async (productId, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  await cloudinary.uploader.destroy(publicId);
  product.imagenes = product.imagenes.filter((img) => img.publicId !== publicId);
  return product.save();
};

const addProductVideo = async (productId, url, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  if (product.videos.length >= 3) {
    throw Object.assign(new Error('Máximo 3 videos por producto.'), { statusCode: 400 });
  }
  product.videos.push({ url, publicId });
  return product.save();
};

const removeProductVideo = async (productId, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  product.videos = product.videos.filter((vid) => vid.publicId !== publicId);
  return product.save();
};

const getSuggestions = async (q, limit = 10) => {
  if (!q || q.trim().length === 0) return [];
  
  const query = q.trim().toLowerCase();
  // Escapar caracteres especiales de regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const suggestions = await Product.find({
    isActive: true,
    $or: [
      { nombre: { $regex: `^${escapedQuery}`, $options: 'i' } },
      { nombre: { $regex: escapedQuery, $options: 'i' } },
      { tags: { $regex: escapedQuery, $options: 'i' } },
    ],
  })
    .select('_id nombre precio precioOferta imagenes')
    .limit(limit)
    .lean();
  
  return suggestions;
};

module.exports = {
  getProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
  addProductVideo,
  removeProductVideo,
  getSuggestions,
};
