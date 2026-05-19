const express = require('express');
const settingsController = require('../controllers/settingsController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET exchange rate (público - lo necesitan todos para conversión)
router.get('/exchange-rate', settingsController.getExchangeRate);

// UPDATE exchange rate (solo admin o tecnico)
router.patch('/exchange-rate', protect, authorizeRoles(['admin', 'tecnico']), settingsController.updateExchangeRate);

// GET all settings (solo admin o tecnico)
router.get('/', protect, authorizeRoles(['admin', 'tecnico']), settingsController.getAllSettings);

module.exports = router;
