const express = require('express');
const router = express.Router();
const {
  createRecommendation,
  getRecommendations,
  getMyRecommendations,
  rejectRecommendation,
  markAsViewed,
  getRecommendationStats,
} = require('../../controllers/recommendationController');
const { protect, adminOnly } = require('../../middleware/auth');

/**
 * ADMIN ROUTES
 */

// POST /api/admin/recommendations - crear recomendación
router.post('/', protect, adminOnly, createRecommendation);

// GET /api/admin/recommendations - listar recomendaciones
router.get('/', protect, adminOnly, getRecommendations);

// GET /api/admin/recommendations/stats - stats
router.get('/stats', protect, adminOnly, getRecommendationStats);

// PUT /api/admin/recommendations/:id/viewed - marcar como visto
router.put('/:id/viewed', protect, adminOnly, markAsViewed);

/**
 * CLIENT ROUTES
 */

// GET /api/recommendations/client - obtener mis recomendaciones
router.get('/client', protect, getMyRecommendations);

// DELETE /api/recommendations/:id - rechazar recomendación
router.delete('/:id', protect, rejectRecommendation);

module.exports = router;
