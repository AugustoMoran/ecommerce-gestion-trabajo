const AdminRecommendation = require('../models/AdminRecommendation');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * POST /api/admin/recommendations
 * Admin crea una recomendación para un cliente
 */
exports.createRecommendation = async (req, res, next) => {
  try {
    const { clientId, productIds, message } = req.body;

    // Validar cliente existe
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Validar productos existen
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos un producto' });
    }

    const products = await Product.find({ _id: { $in: productIds }, isActive: true });
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'Uno o más productos no existen o están inactivos' });
    }

    // Crear recomendación
    const recommendation = new AdminRecommendation({
      clientId,
      productIds,
      message: message || '',
      createdBy: req.user._id,
    });

    await recommendation.save();

    // Poblar datos para respuesta
    await recommendation.populate([
      { path: 'clientId', select: 'nombre apellido email' },
      { path: 'productIds', select: 'nombre priceUSD precio' },
      { path: 'createdBy', select: 'nombre apellido' },
    ]);

    logger.info('Recommendation created', {
      adminId: req.user._id,
      clientId,
      productsCount: productIds.length,
    });

    res.status(201).json({
      message: 'Recomendación creada correctamente',
      recommendation,
    });
  } catch (error) {
    logger.error('Error creating recommendation', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admin/recommendations
 * Admin obtiene todas las recomendaciones
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const recommendations = await AdminRecommendation.find({ isActive: true })
      .populate('clientId', 'nombre apellido email')
      .populate('productIds', 'nombre priceUSD precio')
      .populate('createdBy', 'nombre apellido')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AdminRecommendation.countDocuments({ isActive: true });

    res.json({
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      recommendations,
    });
  } catch (error) {
    logger.error('Error getting recommendations', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/recommendations/client
 * Cliente obtiene sus recomendaciones
 */
exports.getMyRecommendations = async (req, res, next) => {
  try {
    const recommendations = await AdminRecommendation.find({
      clientId: req.user._id,
      isActive: true,
    })
      .populate('productIds')
      .populate('createdBy', 'nombre apellido')
      .sort({ createdAt: -1 });

    res.json({
      total: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error('Error getting client recommendations', { error: error.message });
    next(error);
  }
};

/**
 * DELETE /api/recommendations/:id
 * Cliente rechaza una recomendación
 */
exports.rejectRecommendation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recommendation = await AdminRecommendation.findById(id);
    if (!recommendation) {
      return res.status(404).json({ message: 'Recomendación no encontrada' });
    }

    // Verificar que sea su recomendación
    if (recommendation.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No puedes rechazar una recomendación que no es tuya' });
    }

    // Soft delete
    recommendation.isActive = false;
    await recommendation.save();

    logger.info('Recommendation rejected', {
      clientId: req.user._id,
      recommendationId: id,
    });

    res.json({ message: 'Recomendación rechazada' });
  } catch (error) {
    logger.error('Error rejecting recommendation', { error: error.message });
    next(error);
  }
};

/**
 * PUT /api/admin/recommendations/:id/viewed
 * Marcar recomendación como vista por el cliente
 */
exports.markAsViewed = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recommendation = await AdminRecommendation.findByIdAndUpdate(
      id,
      { viewedAt: new Date() },
      { new: true }
    ).populate('productIds');

    if (!recommendation) {
      return res.status(404).json({ message: 'Recomendación no encontrada' });
    }

    res.json(recommendation);
  } catch (error) {
    logger.error('Error marking recommendation as viewed', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admin/recommendations/stats
 * Stats de recomendaciones
 */
exports.getRecommendationStats = async (req, res, next) => {
  try {
    const total = await AdminRecommendation.countDocuments({ isActive: true });
    const viewed = await AdminRecommendation.countDocuments({
      isActive: true,
      viewedAt: { $ne: null },
    });
    const notViewed = total - viewed;
    const addedToCart = await AdminRecommendation.countDocuments({
      isActive: true,
      addedToCart: { $ne: null },
    });

    res.json({
      total,
      viewed,
      notViewed,
      addedToCart,
      conversionRate: total > 0 ? ((addedToCart / total) * 100).toFixed(2) : 0,
    });
  } catch (error) {
    logger.error('Error getting recommendation stats', { error: error.message });
    next(error);
  }
};
