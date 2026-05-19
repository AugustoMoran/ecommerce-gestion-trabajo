const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../../src/middleware/auth');
const validate = require('../../src/middleware/validate');
const ctrl = require('./job.controller');
const {
  createJobRules,
  updateJobRules,
  takeJobRules,
  finalizeJobRules,
  jobIdRule,
  statusFilterRule,
} = require('./job.validation');

// ─── ADMIN routes ─────────────────────────────────────────────────────────────

// POST /api/jobs → create job
router.post(
  '/',
  protect,
  authorizeRoles(['admin', 'despachante']),
  createJobRules,
  validate,
  ctrl.createJob
);

// GET /api/jobs → list all jobs (with optional ?status= filter)
router.get(
  '/',
  protect,
  authorizeRoles(['admin', 'despachante']),
  statusFilterRule,
  validate,
  ctrl.getAllJobs
);

// PATCH /api/jobs/:id → update job
router.patch(
  '/:id',
  protect,
  authorizeRoles(['admin', 'despachante']),
  updateJobRules,
  validate,
  ctrl.updateJob
);

// DELETE /api/jobs/:id → delete job
router.delete(
  '/:id',
  protect,
  authorizeRoles(['admin', 'despachante']),
  jobIdRule,
  validate,
  ctrl.deleteJob
);

// ─── SHARED routes (admin + technician) ──────────────────────────────────────

// GET /api/jobs/:id → get single job with warranty history
router.get(
  '/:id',
  protect,
  authorizeRoles(['admin', 'tecnico']),
  jobIdRule,
  validate,
  ctrl.getJobById
);

// ─── TECHNICIAN routes ────────────────────────────────────────────────────────

// GET /api/jobs/bolsa/open → bolsa de trabajo (open jobs with available slots)
router.get(
  '/bolsa/open',
  protect,
  authorizeRoles(['admin', 'tecnico']),
  ctrl.getOpenJobs
);

// GET /api/jobs/my/jobs → technician's own jobs grouped by status
router.get(
  '/my/jobs',
  protect,
  authorizeRoles(['admin', 'tecnico']),
  ctrl.getMyJobs
);

// POST /api/jobs/:id/take → take (claim) slots in a job
router.post(
  '/:id/take',
  protect,
  authorizeRoles(['tecnico']),
  takeJobRules,
  validate,
  ctrl.takeJob
);

// POST /api/jobs/:id/start → mark job as IN_PROGRESS
router.post(
  '/:id/start',
  protect,
  authorizeRoles(['admin', 'tecnico']),
  jobIdRule,
  validate,
  ctrl.startJob
);

// POST /api/jobs/:id/finalize → finalize job with observations/photos
router.post(
  '/:id/finalize',
  protect,
  authorizeRoles(['admin', 'tecnico']),
  finalizeJobRules,
  validate,
  ctrl.finalizeJob
);

// POST /api/jobs/:id/abandon → abandon job (remove technician and restore cupo)
router.post(
  '/:id/abandon',
  protect,
  authorizeRoles(['tecnico']),
  jobIdRule,
  validate,
  ctrl.abandonJob
);

// POST /api/jobs/:id/assign → admin assigns technician to job
router.post(
  '/:id/assign',
  protect,
  authorizeRoles(['admin', 'despachante']),
  jobIdRule,
  validate,
  ctrl.assignTechnicianToJob
);

// POST /api/jobs/:id/unassign → admin removes technician from job
router.post(
  '/:id/unassign',
  protect,
  authorizeRoles(['admin', 'despachante']),
  jobIdRule,
  validate,
  ctrl.removeTechnicianFromJob
);

module.exports = router;
