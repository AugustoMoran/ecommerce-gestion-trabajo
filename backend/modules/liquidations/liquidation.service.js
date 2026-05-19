const Job = require('../jobs/Job.model');
const liquidationRepo = require('./liquidation.repository');
const User = require('../../src/models/User');

/**
 * Calculate how much a technician earns from a single job.
 *
 * splitMode = "equal"  → divide price by number of UNIQUE technicians
 * splitMode = "custom" → divide price proportionally by slots taken
 *
 * assignedTechnicians stores one entry per slot (can have duplicate IDs),
 * so we count occurrences to determine each technician's slot count.
 */
const calcEarnings = (job, technicianId, splitMode) => {
  const totalSlots = job.assignedTechnicians.length;
  const techId = technicianId.toString();

  // Count how many slots this technician took
  const techSlots = job.assignedTechnicians.filter((id) => id.toString() === techId).length;

  if (techSlots === 0) return 0;

  if (splitMode === 'equal') {
    // Count unique technicians
    const uniqueTechs = new Set(job.assignedTechnicians.map((id) => id.toString())).size;
    return job.price / uniqueTechs;
  }

  // splitMode = "custom": proportional by slots
  return (job.price * techSlots) / totalSlots;
};

/**
 * ADMIN: Generate (preview) a liquidation for a technician over a date range.
 * Returns the computed total and breakdown without persisting.
 */
const previewLiquidation = async ({ technicianId, startDate, endDate, splitMode = 'equal' }) => {
  const technician = await User.findById(technicianId).select('nombre apellido email role');
  if (!technician || technician.role !== 'tecnico') {
    throw Object.assign(new Error('Técnico no encontrado'), { statusCode: 404 });
  }

  // Fetch DONE jobs assigned to this technician within the date range
  const jobs = await Job.find({
    assignedTechnicians: technicianId,
    status: 'DONE',
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  let total = 0;
  const breakdown = [];

  for (const job of jobs) {
    const earned = calcEarnings(job, technicianId, splitMode);
    const techSlots = job.assignedTechnicians.filter(
      (id) => id.toString() === technicianId.toString()
    ).length;

    total += earned;
    breakdown.push({
      jobId: job._id,
      jobPrice: job.price,
      technicianSlots: techSlots,
      totalSlots: job.assignedTechnicians.length,
      earned: parseFloat(earned.toFixed(2)),
    });
  }

  return {
    technician,
    startDate,
    endDate,
    splitMode,
    total: parseFloat(total.toFixed(2)),
    breakdown,
    jobs: jobs.map((j) => j._id),
  };
};

/**
 * ADMIN: Create and persist a liquidation for a technician.
 */
const createLiquidation = async ({ technicianId, startDate, endDate, splitMode = 'equal' }) => {
  const preview = await previewLiquidation({ technicianId, startDate, endDate, splitMode });

  const liquidation = await liquidationRepo.create({
    technicianId,
    jobs: preview.jobs,
    total: preview.total,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    splitMode,
    breakdown: preview.breakdown,
  });

  return liquidationRepo.findById(liquidation._id);
};

/**
 * Get all liquidations (admin) or filtered by technician.
 */
const getLiquidations = async (filter = {}) => {
  return liquidationRepo.findAll(filter);
};

/**
 * Get liquidations for a specific technician.
 * Used by the technician themselves or admin.
 */
const getMyLiquidations = async (technicianId) => {
  return liquidationRepo.findByTechnician(technicianId);
};

/**
 * Get a single liquidation by ID.
 */
const getLiquidationById = async (id) => {
  const liq = await liquidationRepo.findById(id);
  if (!liq) throw Object.assign(new Error('Liquidación no encontrada'), { statusCode: 404 });
  return liq;
};

module.exports = {
  previewLiquidation,
  createLiquidation,
  getLiquidations,
  getMyLiquidations,
  getLiquidationById,
};
