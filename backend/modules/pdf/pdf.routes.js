const express = require('express');
const router = express.Router();

const { protect, optionalAuth, authorizeRoles } = require('../../src/middleware/auth');
const { param } = require('express-validator');
const validate = require('../../src/middleware/validate');
const ctrl = require('./pdf.controller');

const orderIdRule = [param('orderId').isMongoId().withMessage('orderId inválido')];

/**
 * POST /api/pdf/presupuesto
 * Generate a budget PDF (PENDIENTE).
 * Accessible by logged-in users or admin. Also accepts a raw order body.
 */
router.post('/presupuesto', optionalAuth, ctrl.downloadBudget);

/**
 * GET /api/pdf/comprobante/:orderId
 * Download a payment receipt PDF for a confirmed order.
 * Accessible by the order owner or admin.
 */
router.get('/comprobante/:orderId', protect, orderIdRule, validate, ctrl.downloadReceipt);

/**
 * POST /api/pdf/whatsapp/:orderId
 * Upload PDF to Cloudinary and return the public link + wa.me URL.
 * Accessible by any authenticated user (the one who placed the order).
 */
router.post('/whatsapp/:orderId', optionalAuth, orderIdRule, validate, ctrl.generateWhatsAppPDF);

module.exports = router;
