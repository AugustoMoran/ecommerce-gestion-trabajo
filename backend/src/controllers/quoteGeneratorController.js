const Quote = require('../models/Quote');
const User = require('../models/User');
const Product = require('../models/Product');
const { generateQuotePDF, sendQuoteEmail } = require('../services/quoteService');

// Función helper para calcular totales por moneda
const calculateTotalsByByCurrency = (items, instalacion) => {
  const currencies = { USD: 0, ARS: 0 };
  
  // Sumar items por moneda
  items.forEach(item => {
    const currency = item.currency || 'USD';
    currencies[currency] = (currencies[currency] || 0) + item.subtotal;
  });

  // Crear objeto de totales sin duplicar instalación
  const totales = {
    USD: {
      subtotal: currencies.USD || 0,
      instalacion: 0,
      total: currencies.USD || 0,
    },
    ARS: {
      subtotal: currencies.ARS || 0,
      instalacion: 0,
      total: currencies.ARS || 0,
    },
  };

  // Asignar instalación a la moneda que tenga productos (prioridad USD)
  if (instalacion?.incluye && instalacion.monto > 0) {
    if (totales.USD.subtotal > 0) {
      totales.USD.instalacion = instalacion.monto;
      totales.USD.total = totales.USD.subtotal + instalacion.monto;
    } else if (totales.ARS.subtotal > 0) {
      totales.ARS.instalacion = instalacion.monto;
      totales.ARS.total = totales.ARS.subtotal + instalacion.monto;
    } else {
      // Si no hay productos, asignar a USD por defecto
      totales.USD.instalacion = instalacion.monto;
      totales.USD.total = instalacion.monto;
    }
  }

  // Total final es suma de ambas monedas
  const total = totales.USD.total + totales.ARS.total;

  return {
    USD: totales.USD,
    ARS: totales.ARS,
    subtotal: currencies.USD + currencies.ARS,
    instalacion: instalacion?.incluye ? instalacion.monto : 0,
    descuento: 0,
    total,
  };
};

const createQuote = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden crear presupuestos' });
    }

    const { clientId, items, instalacion, notas } = req.body;
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const processedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.producto);
        return {
          producto: item.producto,
          nombre: item.nombre || product?.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.cantidad * item.precioUnitario,
          currency: item.currency || 'USD',
        };
      })
    );

    // Calcular totales por moneda
    const totales = calculateTotalsByByCurrency(processedItems, instalacion);

    const lastQuote = await Quote.findOne().sort({ createdAt: -1 });
    const nextNumber = lastQuote ? parseInt(lastQuote.numero.split('-')[1]) + 1 : 1;
    const numero = `PSP-${String(nextNumber).padStart(4, '0')}`;

    const quote = new Quote({
      numero,
      client: {
        _id: client._id,
        nombre: client.nombre,
        email: client.email,
        telefono: client.telefono,
        direccion: client.direccion,
      },
      items: processedItems,
      instalacion: {
        incluye: instalacion?.incluye || false,
        monto: instalacion?.monto || 0,
        descripcion: instalacion?.descripcion,
      },
      totales,
      notas,
      createdBy: req.user._id,
    });

    await quote.save();
    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

const getAllQuotes = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const quotes = await Quote.find().sort({ createdAt: -1 }).populate('createdBy', 'nombre');
    res.json(quotes);
  } catch (error) {
    next(error);
  }
};

const getQuoteById = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('createdBy', 'nombre');
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (req.user.role !== 'admin' && quote.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    res.json(quote);
  } catch (error) {
    next(error);
  }
};

const getMyQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ 'client._id': req.user._id }).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    next(error);
  }
};

const updateQuote = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (quote.estado !== 'borrador') {
      return res.status(400).json({ message: 'Solo se pueden editar presupuestos en borrador' });
    }

    const { items, instalacion, notas } = req.body;

    if (items) {
      const processedItems = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findById(item.producto);
          return {
            producto: item.producto,
            nombre: item.nombre || product?.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario,
            currency: item.currency || 'USD',
          };
        })
      );
      quote.items = processedItems;
    }

    if (instalacion) {
      quote.instalacion = {
        incluye: instalacion.incluye || false,
        monto: instalacion.monto || 0,
        descripcion: instalacion.descripcion,
      };
    }

    if (notas !== undefined) {
      quote.notas = notas;
    }

    // Calcular totales por moneda
    quote.totales = calculateTotalsByByCurrency(quote.items, quote.instalacion);

    await quote.save();
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

const sendQuote = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    const pdfBuffer = await generateQuotePDF(quote);
    await sendQuoteEmail(quote, pdfBuffer);

    quote.estado = 'enviado';
    quote.enviado = {
      fecha: new Date(),
      email: quote.client.email,
      visto: false,
    };

    await quote.save();
    res.json({ message: 'Presupuesto enviado', quote });
  } catch (error) {
    next(error);
  }
};

const downloadQuotePDF = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (req.user.role !== 'admin' && quote.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const pdfBuffer = await generateQuotePDF(quote);

    if (quote.client._id.toString() === req.user._id.toString()) {
      quote.enviado.descargadoFecha = new Date();
      await quote.save();
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="presupuesto-${quote.numero}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const updateQuoteStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;

    if (!['aceptado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (quote.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    quote.estado = estado;
    await quote.save();

    res.json({ message: `Presupuesto marcado como ${estado}`, quote });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/quotes/:id - eliminar presupuesto (solo admin, solo borrador o enviado)
const deleteQuote = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    // Permitir eliminar presupuestos en estado borrador o enviado
    if (!['borrador', 'enviado'].includes(quote.estado)) {
      return res.status(400).json({ message: 'Solo se pueden eliminar presupuestos en estado borrador o enviado' });
    }

    await Quote.findByIdAndDelete(req.params.id);

    res.json({ message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuote,
  getAllQuotes,
  getQuoteById,
  getMyQuotes,
  updateQuote,
  sendQuote,
  downloadQuotePDF,
  updateQuoteStatus,
  deleteQuote,
};
