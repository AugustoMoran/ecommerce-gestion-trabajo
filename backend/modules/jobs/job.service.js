const jobRepo = require('./job.repository');

/**
 * ADMIN: Create a new job.
 * Status always starts as OPEN, assignedTechnicians can be provided on creation.
 */
const createJob = async (data) => {
  const { title, description, date, clientName, clientPhone, address, price, slots, previousJobId, assignedTechnicians } = data;
  return jobRepo.create({
    title,
    description,
    date,
    clientName,
    clientPhone,
    address,
    price,
    slots,
    previousJobId: previousJobId || null,
    status: 'OPEN',
    assignedTechnicians: assignedTechnicians && Array.isArray(assignedTechnicians) ? assignedTechnicians : [],
  });
};

/**
 * ADMIN: Get all jobs with optional status filter.
 */
const getAllJobs = async (filter = {}) => {
  return jobRepo.findAll(filter);
};

/**
 * ADMIN: Update job fields.
 */
const updateJob = async (jobId, data) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });
  
  // Allow updating: title, description, date, clientName, clientPhone, address, price, slots, status, observations, assignedTechnicians
  const allowedFields = ['title', 'description', 'date', 'clientName', 'clientPhone', 'address', 'price', 'slots', 'status', 'observations', 'assignedTechnicians'];
  const update = {};
  
  allowedFields.forEach(field => {
    if (field in data) {
      update[field] = data[field];
    }
  });
  
  return jobRepo.updateById(jobId, update);
};

/**
 * ADMIN: Delete a job.
 */
const deleteJob = async (jobId) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });
  return jobRepo.deleteById(jobId);
};

/**
 * TECHNICIAN: Get open jobs with available slots (bolsa de trabajo).
 * Only returns OPEN jobs where slots haven't been completely filled.
 */
const getOpenJobs = async () => {
  const jobs = await jobRepo.findOpenWithSlots();
  // Defense in depth: filter out jobs where assignedTechnicians length already equals slots
  return jobs.filter((j) => j.assignedTechnicians.length < j.slots);
};

/**
 * TECHNICIAN: Get a technician's jobs grouped by status.
 */
const getMyJobs = async (technicianId) => {
  const jobs = await jobRepo.findByTechnician(technicianId);
  return jobs.reduce(
    (acc, job) => {
      if (job.status === 'DONE') acc.finalizados.push(job);
      else if (job.status === 'IN_PROGRESS') acc.enCurso.push(job);
      else acc.pendientes.push(job);
      return acc;
    },
    { pendientes: [], enCurso: [], finalizados: [] }
  );
};

/**
 * TECHNICIAN: Claim one or more slots from a job.
 *
 * Rules:
 * - A technician may only claim slots from a job ONCE.
 * - slotsRequested must be between 1 and available slots.
 * - If all slots are filled: status = FULL.
 *
 * assignedTechnicians stores one entry per slot (allows duplicate IDs for proportional liquidation).
 */
const takeJob = async (jobId, technicianId, slotsRequested = 1) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });

  if (job.status !== 'OPEN') {
    throw Object.assign(
      new Error('El trabajo no está disponible (no está en estado OPEN)'),
      { statusCode: 400 }
    );
  }

  // Check if technician already claimed any slot on this job
  const alreadyClaimed = job.assignedTechnicians.some(
    (t) => t._id.toString() === technicianId.toString()
  );
  if (alreadyClaimed) {
    throw Object.assign(new Error('Ya tomaste un cupo en este trabajo'), { statusCode: 400 });
  }

  const takenSlots = job.assignedTechnicians.length;
  const availableSlots = job.slots - takenSlots;

  if (slotsRequested < 1 || slotsRequested > availableSlots) {
    throw Object.assign(
      new Error(`Cupos inválidos. Disponibles: ${availableSlots}`),
      { statusCode: 400 }
    );
  }

  // Build the array of IDs to push (one per slot requested)
  const newEntries = Array(slotsRequested).fill(technicianId);
  const newTotal = takenSlots + slotsRequested;
  const newStatus = newTotal >= job.slots ? 'FULL' : 'OPEN';

  return jobRepo.updateById(jobId, {
    $push: { assignedTechnicians: { $each: newEntries } },
    status: newStatus,
  });
};

/**
 * TECHNICIAN: Mark job as IN_PROGRESS.
 * Only assigned technicians can start it.
 */
const startJob = async (jobId, technicianId) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });

  if (job.status === 'DONE') {
    throw Object.assign(new Error('El trabajo ya está finalizado'), { statusCode: 400 });
  }

  const isAssigned = job.assignedTechnicians.some(
    (t) => t._id.toString() === technicianId.toString()
  );
  if (!isAssigned) {
    throw Object.assign(new Error('No estás asignado a este trabajo'), { statusCode: 403 });
  }

  return jobRepo.updateById(jobId, { status: 'IN_PROGRESS' });
};

/**
 * TECHNICIAN: Finalize a job.
 * Only assigned technicians can finalize it.
 * Allows adding observations and photos.
 */
const finalizeJob = async (jobId, technicianId, { observations = '', photos = [] } = {}) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });

  if (job.status === 'DONE') {
    throw Object.assign(new Error('El trabajo ya está finalizado'), { statusCode: 400 });
  }

  const isAssigned = job.assignedTechnicians.some(
    (t) => t._id.toString() === technicianId.toString()
  );
  if (!isAssigned) {
    throw Object.assign(new Error('No estás asignado a este trabajo'), { statusCode: 403 });
  }

  return jobRepo.updateById(jobId, {
    status: 'DONE',
    observations,
    ...(photos.length > 0 && { $push: { photos: { $each: photos } } }),
  });
};

/**
 * TECHNICIAN: Abandon a job (remove self from assignedTechnicians).
 * Restores cupo and changes status from FULL back to OPEN if needed.
 */
const abandonJob = async (jobId, technicianId) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });

  // Check if technician is assigned
  const isAssigned = job.assignedTechnicians.some(
    (t) => t._id?.toString() === technicianId.toString()
  );
  if (!isAssigned) {
    throw Object.assign(
      new Error('No estás asignado a este trabajo'),
      { statusCode: 400 }
    );
  }

  // Remove ONE instance of this technician from assignedTechnicians
  const updatedAssigned = job.assignedTechnicians.filter(
    (t) => t._id?.toString() !== technicianId.toString()
  );

  // If status is FULL and we now have available slots, change to OPEN
  const newStatus = updatedAssigned.length < job.slots ? 'OPEN' : job.status;

  return jobRepo.updateById(jobId, {
    assignedTechnicians: updatedAssigned,
    status: newStatus,
  });
};

/**
 * ADMIN: Assign a technician to a job.
 * Adds technician to assignedTechnicians and updates status to FULL if all slots are taken.
 */
const assignTechnicianToJob = async (jobId, technicianId) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });

  // Check if technician already assigned
  const alreadyAssigned = job.assignedTechnicians.some(
    (t) => t._id?.toString() === technicianId.toString()
  );
  if (alreadyAssigned) {
    throw Object.assign(
      new Error('Este técnico ya está asignado al trabajo'),
      { statusCode: 400 }
    );
  }

  const currentCount = job.assignedTechnicians.length;
  if (currentCount >= job.slots) {
    throw Object.assign(
      new Error('No hay cupos disponibles en este trabajo'),
      { statusCode: 400 }
    );
  }

  const newTotal = currentCount + 1;
  const newStatus = newTotal >= job.slots ? 'FULL' : job.status;

  return jobRepo.updateById(jobId, {
    $push: { assignedTechnicians: technicianId },
    status: newStatus,
  });
};

/**
 * ADMIN: Remove a technician from a job.
 * Removes technician from assignedTechnicians and updates status to OPEN if slots become available.
 */
const removeTechnicianFromJob = async (jobId, technicianId) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });

  // Check if technician is assigned
  const isAssigned = job.assignedTechnicians.some(
    (t) => t._id?.toString() === technicianId.toString()
  );
  if (!isAssigned) {
    throw Object.assign(
      new Error('Este técnico no está asignado al trabajo'),
      { statusCode: 400 }
    );
  }

  // Remove ONE instance of this technician
  const updatedAssigned = job.assignedTechnicians.filter(
    (t) => t._id?.toString() !== technicianId.toString()
  );

  // If status is FULL and we now have available slots, change to OPEN
  const newStatus = updatedAssigned.length < job.slots ? 'OPEN' : job.status;

  return jobRepo.updateById(jobId, {
    assignedTechnicians: updatedAssigned,
    status: newStatus,
  });
};

/**
 * Get a single job by ID.
 */
const getJobById = async (jobId) => {
  const job = await jobRepo.findById(jobId);
  if (!job) throw Object.assign(new Error('Trabajo no encontrado'), { statusCode: 404 });
  return job;
};

module.exports = {
  createJob,
  getAllJobs,
  updateJob,
  deleteJob,
  getOpenJobs,
  getMyJobs,
  takeJob,
  startJob,
  finalizeJob,
  getJobById,
  abandonJob,
  assignTechnicianToJob,
  removeTechnicianFromJob,
};
