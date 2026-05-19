const jobService = require('./job.service');

// ─── ADMIN ────────────────────────────────────────────────────────────────────

const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.body);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

const getAllJobs = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const jobs = await jobService.getAllJobs(filter);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.body);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    await jobService.deleteJob(req.params.id);
    res.json({ message: 'Trabajo eliminado' });
  } catch (err) {
    next(err);
  }
};

// ─── SHARED (admin + technician) ─────────────────────────────────────────────

const getJobById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

// ─── TECHNICIAN ───────────────────────────────────────────────────────────────

const getOpenJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.getOpenJobs();
    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

const getMyJobs = async (req, res, next) => {
  try {
    const data = await jobService.getMyJobs(req.user._id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const takeJob = async (req, res, next) => {
  try {
    const slotsRequested = Number(req.body.slots) || 1;
    const job = await jobService.takeJob(req.params.id, req.user._id, slotsRequested);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const startJob = async (req, res, next) => {
  try {
    const job = await jobService.startJob(req.params.id, req.user._id);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const finalizeJob = async (req, res, next) => {
  try {
    const { observations, photos } = req.body;
    const job = await jobService.finalizeJob(req.params.id, req.user._id, {
      observations,
      photos,
    });
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const abandonJob = async (req, res, next) => {
  try {
    const job = await jobService.abandonJob(req.params.id, req.user._id);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const assignTechnicianToJob = async (req, res, next) => {
  try {
    const { technicianId } = req.body;
    const job = await jobService.assignTechnicianToJob(req.params.id, technicianId);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

const removeTechnicianFromJob = async (req, res, next) => {
  try {
    const { technicianId } = req.body;
    const job = await jobService.removeTechnicianFromJob(req.params.id, technicianId);
    res.json(job);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createJob,
  getAllJobs,
  updateJob,
  deleteJob,
  getJobById,
  getOpenJobs,
  getMyJobs,
  takeJob,
  startJob,
  finalizeJob,
  abandonJob,
  assignTechnicianToJob,
  removeTechnicianFromJob,
};
