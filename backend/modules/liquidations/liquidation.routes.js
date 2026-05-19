const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../../src/middleware/auth');
const validate = require('../../src/middleware/validate');
const ctrl = require('./liquidation.controller');
const {
  createLiquidationRules,
  liquidationIdRule,
  technicianIdRule,
} = require('./liquidation.validation');

// ADMIN: Preview (dry-run) a liquidation
router.post(
  '/preview',
  protect,
  authorizeRoles(['admin']),
  createLiquidationRules,
  validate,
  ctrl.previewLiquidation
);

// ADMIN: Create (persist) a liquidation
router.post(
  '/',
  protect,
  authorizeRoles(['admin']),
  createLiquidationRules,
  validate,
  ctrl.createLiquidation
);

// ADMIN: Get all liquidations
router.get(
  '/',
  protect,
  authorizeRoles(['admin']),
  ctrl.getAllLiquidations
);

// ADMIN: Get liquidations for a specific technician
router.get(
  '/technician/:technicianId',
  protect,
  authorizeRoles(['admin']),
  technicianIdRule,
  validate,
  ctrl.getLiquidationsByTechnician
);

// TECHNICIAN: Get own liquidations
router.get(
  '/my',
  protect,
  authorizeRoles(['admin', 'tecnico']),
  ctrl.getMyLiquidations
);

// ADMIN + TECHNICIAN: Get single liquidation detail
router.get(
  '/:id',
  protect,
  authorizeRoles(['admin', 'tecnico']),
  liquidationIdRule,
  validate,
  ctrl.getLiquidationById
);

module.exports = router;
