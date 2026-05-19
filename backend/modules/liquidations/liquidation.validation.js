const { body, param } = require('express-validator');

const createLiquidationRules = [
  body('technicianId').isMongoId().withMessage('technicianId debe ser un ID válido'),
  body('startDate').isISO8601().withMessage('startDate debe ser una fecha válida'),
  body('endDate').isISO8601().withMessage('endDate debe ser una fecha válida'),
  body('splitMode')
    .optional()
    .isIn(['equal', 'custom'])
    .withMessage('splitMode debe ser "equal" o "custom"'),
];

const liquidationIdRule = [
  param('id').isMongoId().withMessage('ID de liquidación inválido'),
];

const technicianIdRule = [
  param('technicianId').isMongoId().withMessage('ID de técnico inválido'),
];

module.exports = {
  createLiquidationRules,
  liquidationIdRule,
  technicianIdRule,
};
