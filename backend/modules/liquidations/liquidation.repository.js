const Liquidation = require('./Liquidation.model');

const create = (data) => Liquidation.create(data);

const findByTechnician = (technicianId) =>
  Liquidation.find({ technicianId })
    .populate('technicianId', 'nombre apellido email')
    .populate('jobs', 'title date price slots status')
    .sort({ createdAt: -1 });

const findAll = (filter = {}) =>
  Liquidation.find(filter)
    .populate('technicianId', 'nombre apellido email')
    .populate('jobs', 'title date price slots status')
    .sort({ createdAt: -1 });

const findById = (id) =>
  Liquidation.findById(id)
    .populate('technicianId', 'nombre apellido email')
    .populate('jobs');

module.exports = { create, findByTechnician, findAll, findById };
