const liquidationService = require('./liquidation.service');

// ADMIN: Preview a liquidation (dry run, not persisted)
const previewLiquidation = async (req, res, next) => {
  try {
    const { technicianId, startDate, endDate, splitMode } = req.body;
    const preview = await liquidationService.previewLiquidation({
      technicianId,
      startDate,
      endDate,
      splitMode,
    });
    res.json(preview);
  } catch (err) {
    next(err);
  }
};

// ADMIN: Create and persist a liquidation
const createLiquidation = async (req, res, next) => {
  try {
    const { technicianId, startDate, endDate, splitMode } = req.body;
    const liquidation = await liquidationService.createLiquidation({
      technicianId,
      startDate,
      endDate,
      splitMode,
    });
    res.status(201).json(liquidation);
  } catch (err) {
    next(err);
  }
};

// ADMIN: Get all liquidations
const getAllLiquidations = async (req, res, next) => {
  try {
    const liquidations = await liquidationService.getLiquidations();
    res.json(liquidations);
  } catch (err) {
    next(err);
  }
};

// ADMIN: Get liquidations for a specific technician
const getLiquidationsByTechnician = async (req, res, next) => {
  try {
    const liquidations = await liquidationService.getMyLiquidations(req.params.technicianId);
    res.json(liquidations);
  } catch (err) {
    next(err);
  }
};

// TECHNICIAN: Get own liquidations
const getMyLiquidations = async (req, res, next) => {
  try {
    const liquidations = await liquidationService.getMyLiquidations(req.user._id);
    res.json(liquidations);
  } catch (err) {
    next(err);
  }
};

// ADMIN + TECHNICIAN: Get single liquidation detail
const getLiquidationById = async (req, res, next) => {
  try {
    const liq = await liquidationService.getLiquidationById(req.params.id);

    // Technicians can only see their own liquidations
    if (
      req.user.role === 'tecnico' &&
      liq.technicianId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Acceso denegado.' });
    }

    res.json(liq);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  previewLiquidation,
  createLiquidation,
  getAllLiquidations,
  getLiquidationsByTechnician,
  getMyLiquidations,
  getLiquidationById,
};
