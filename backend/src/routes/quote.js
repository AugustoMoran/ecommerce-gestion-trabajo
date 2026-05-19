const express = require('express');
const router = express.Router();
const {
  getCurrentQuote,
  updateQuote,
  getQuoteHistory,
  getQuoteStats,
} = require('../controllers/quoteController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * PUBLIC ROUTES
 */

// Get current dollar quote
router.get('/', getCurrentQuote);

/**
 * ADMIN ONLY ROUTES
 */

// Update quote (admin only)
router.put('/update', protect, adminOnly, updateQuote);

// Get quote history (admin only)
router.get('/history', protect, adminOnly, getQuoteHistory);

// Get quote stats (admin only)
router.get('/stats', protect, adminOnly, getQuoteStats);

module.exports = router;
