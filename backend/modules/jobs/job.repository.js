const Job = require('./Job.model');

const TECHNICIAN_POPULATE = 'nombre apellido email telefono';

const create = (data) => Job.create(data);

const findById = (id) =>
  Job.findById(id)
    .populate('assignedTechnicians', TECHNICIAN_POPULATE)
    .populate({ path: 'previousJobId', populate: { path: 'assignedTechnicians', select: TECHNICIAN_POPULATE } });

const findAll = (filter = {}) =>
  Job.find(filter)
    .populate('assignedTechnicians', TECHNICIAN_POPULATE)
    .sort({ createdAt: -1 });

const findOpenWithSlots = () =>
  Job.find({ status: 'OPEN' })
    .populate('assignedTechnicians', TECHNICIAN_POPULATE)
    .sort({ date: 1 });

const findByTechnician = (technicianId) =>
  Job.find({ assignedTechnicians: technicianId })
    .populate('assignedTechnicians', TECHNICIAN_POPULATE)
    .sort({ date: -1 });

const updateById = (id, update, options = { new: true }) =>
  Job.findByIdAndUpdate(id, update, options)
    .populate('assignedTechnicians', TECHNICIAN_POPULATE);

const deleteById = (id) => Job.findByIdAndDelete(id);

module.exports = {
  create,
  findById,
  findAll,
  findOpenWithSlots,
  findByTechnician,
  updateById,
  deleteById,
};
