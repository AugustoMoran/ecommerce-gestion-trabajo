require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const cleanup = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    
    // Eliminar los duplicados (los 4 últimos productos)
    const allProducts = await Product.find({}).sort({ createdAt: -1 }).lean();
    console.log(`Total productos: ${allProducts.length}\n`);
    
    // Eliminar los productos nuevos (mantener los 3 antiguos + 1 nuevo de cada tipo)
    const toDelete = await Product.deleteMany({
      nombre: { $in: ['Aire Acondicionado 3000W', 'Heladera Inverter', 'Notebook Dell (SIN instalación)'] }
    });
    
    console.log(`✅ Eliminados ${toDelete.deletedCount} productos duplicados\n`);
    
    // Recrear solo los 3 que necesitamos
    const testProducts = [
      {
        nombre: 'Aire Acondicionado 3000W',
        descripcion: 'Aire acondicionado de alta potencia con instalación disponible',
        priceUSD: 500,
        pricePesos: 500000,
        priceOfferUSD: 450,
        priceOfferPesos: 450000,
        hasInstallation: true,
        installationZones: ['AMBA', 'CABA'],
        stock: 10,
        colores: [],
        tallas: { habilitadas: [] },
        imagenes: [],
        videos: [],
        isActive: true,
      },
      {
        nombre: 'Heladera Inverter',
        descripcion: 'Heladera con tecnología inverter. Servicio de instalación disponible en AMBA',
        priceUSD: 800,
        pricePesos: 800000,
        hasInstallation: true,
        installationZones: ['AMBA', 'CABA'],
        stock: 5,
        colores: [],
        tallas: { habilitadas: [] },
        imagenes: [],
        videos: [],
        isActive: true,
      },
      {
        nombre: 'Notebook Dell (SIN instalación)',
        descripcion: 'Notebook sin servicio de instalación',
        priceUSD: 1200,
        pricePesos: 1200000,
        hasInstallation: false,
        installationZones: [],
        stock: 15,
        colores: [],
        tallas: { habilitadas: [] },
        imagenes: [],
        videos: [],
        isActive: true,
      }
    ];

    const created = await Product.insertMany(testProducts);
    console.log(`✅ Creados ${created.length} productos de prueba\n`);

    // Verificar
    const remaining = await Product.find({}).lean();
    console.log(`✅ Total productos en BD: ${remaining.length}`);
    remaining.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nombre} (stock: ${p.stock})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

cleanup();
