const { body, param, query } = require('express-validator');

const createJobRules = [
  body('title').trim().notEmpty().withMessage('El título es requerido'),
  body('description').trim().notEmpty().withMessage('La descripción es requerida'),
  body('date').isISO8601().withMessage('La fecha debe ser válida (ISO 8601)'),
  body('clientName').trim().notEmpty().withMessage('El nombre del cliente es requerido'),
  body('clientPhone').trim().notEmpty().withMessage('El teléfono del cliente es requerido'),
  body('address').trim().notEmpty().withMessage('La dirección es requerida'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('slots').isInt({ min: 1 }).withMessage('Los cupos deben ser al menos 1'),
  body('previousJobId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('previousJobId debe ser un ID válido'),
];

const updateJobRules = [
  param('id').isMongoId().withMessage('ID de trabajo inválido'),
  body('title').optional().trim().notEmpty().withMessage('El título no puede estar vacío'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Precio inválido'),
  body('slots').optional().isInt({ min: 1 }).withMessage('Cupos mínimos: 1'),
  body('status')
    .optional()
    .isIn(['OPEN', 'FULL', 'IN_PROGRESS', 'DONE'])
    .withMessage('Estado inválido'),
];

const takeJobRules = [
  param('id').isMongoId().withMessage('ID de trabajo inválido'),
  body('slots')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Los cupos deben ser al menos 1'),
];

const finalizeJobRules = [
  param('id').isMongoId().withMessage('ID de trabajo inválido'),
  body('observations').optional().isString(),
  body('photos').optional().isArray().withMessage('Photos debe ser un array de URLs'),
  body('photos.*').optional().isURL().withMessage('Cada foto debe ser una URL válida'),
];

const jobIdRule = [param('id').isMongoId().withMessage('ID de trabajo inválido')];

const statusFilterRule = [
  query('status')
    .optional()
    .isIn(['OPEN', 'FULL', 'IN_PROGRESS', 'DONE'])
    .withMessage('Estado inválido'),
];

module.exports = {
  createJobRules,
  updateJobRules,
  takeJobRules,
  finalizeJobRules,
  jobIdRule,
  statusFilterRule,
};
