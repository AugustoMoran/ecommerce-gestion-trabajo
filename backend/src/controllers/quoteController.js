const DollarQuote = require('../models/DollarQuote');
const logger = require('../utils/logger');

/**
 * GET /api/quote/current
 * Obtener la cotización actual del dólar
 * Accesible por todos (público)
 */
exports.getCurrentQuote = async (req, res, next) => {
  try {
    const quote = await DollarQuote.getCurrentQuote();

    if (!quote) {
      return res.status(404).json({
        message: 'No hay cotización disponible. Contacte al administrador.',
      });
    }

    res.json({
      quotePesosPerDollar: quote.quotePesosPerDollar,
      updatedAt: quote.updatedAt,
      updatedBy: quote.updatedBy,
    });
  } catch (error) {
    logger.error('Error getting current quote', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/admin/quote/update
 * Admin actualiza la cotización del dólar
 * Solo Admin
 */
exports.updateQuote = async (req, res, next) => {
  try {
    const { quotePesosPerDollar, description } = req.body;

    // Validaciones
    if (!quotePesosPerDollar || quotePesosPerDollar <= 0) {
      return res.status(400).json({
        message: 'La cotización debe ser un número positivo',
      });
    }

    // Desactivar cotización anterior
    await DollarQuote.updateMany({ isActive: true }, { isActive: false });

    // Crear nueva cotización
    const newQuote = new DollarQuote({
      quotePesosPerDollar,
      description: description || '',
      updatedBy: req.user._id,
    });

    await newQuote.save();

    logger.info('Dollar quote updated', {
      userId: req.user._id,
      quote: quotePesosPerDollar,
    });

    res.status(201).json({
      message: 'Cotización actualizada correctamente',
      quote: {
        quotePesosPerDollar: newQuote.quotePesosPerDollar,
        updatedAt: newQuote.createdAt,
        updatedBy: newQuote.updatedBy,
      },
    });
  } catch (error) {
    logger.error('Error updating quote', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admin/quote/history
 * Admin ve el historial de cotizaciones
 * Solo Admin
 */
exports.getQuoteHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const quotes = await DollarQuote.find()
      .populate('updatedBy', 'nombre apellido email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await DollarQuote.countDocuments();

    res.json({
      total,
      limit,
      skip,
      quotes,
    });
  } catch (error) {
    logger.error('Error getting quote history', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admin/quote/stats
 * Stats sobre cambios de cotización
 * Solo Admin
 */
exports.getQuoteStats = async (req, res, next) => {
  try {
    const currentQuote = await DollarQuote.getCurrentQuote();
    const lastUpdate = await DollarQuote.findOne()
      .sort({ createdAt: -1 })
      .select('quotePesosPerDollar createdAt');

    // Calcular cambio desde hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const quoteSevenDaysAgo = await DollarQuote.findOne({ createdAt: { $lte: sevenDaysAgo } })
      .sort({ createdAt: -1 })
      .select('quotePesosPerDollar');

    const changePercent = quoteSevenDaysAgo
      ? (((currentQuote.quotePesosPerDollar - quoteSevenDaysAgo.quotePesosPerDollar) /
          quoteSevenDaysAgo.quotePesosPerDollar) *
          100).toFixed(2)
      : 0;

    res.json({
      currentQuote: currentQuote.quotePesosPerDollar,
      lastUpdate: lastUpdate.createdAt,
      changePercent,
      totalUpdates: await DollarQuote.countDocuments(),
    });
  } catch (error) {
    logger.error('Error getting quote stats', { error: error.message });
    next(error);
  }
};
