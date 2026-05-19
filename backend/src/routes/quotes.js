const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createQuote,
  getAllQuotes,
  getQuoteById,
  getMyQuotes,
  updateQuote,
  sendQuote,
  downloadQuotePDF,
  updateQuoteStatus,
  deleteQuote,
} = require('../controllers/quoteGeneratorController');

// Admin: Crear presupuesto
router.post('/', protect, createQuote);

// Admin: Obtener todos
router.get('/admin/all', protect, getAllQuotes);

// Cliente: Mis presupuestos
router.get('/mis-presupuestos', protect, getMyQuotes);

// Obtener presupuesto por ID (admin o cliente dueño)
router.get('/:id', protect, getQuoteById);

// Admin: Actualizar presupuesto
router.put('/:id', protect, updateQuote);

// Admin: Enviar por email
router.post('/:id/enviar', protect, sendQuote);

// Descargar PDF (admin o cliente dueño)
router.get('/:id/pdf', protect, downloadQuotePDF);

// Cliente: Cambiar estado
router.put('/:id/status', protect, updateQuoteStatus);

// Admin: Eliminar presupuesto (solo borrador)
router.delete('/:id', protect, deleteQuote);

module.exports = router;
