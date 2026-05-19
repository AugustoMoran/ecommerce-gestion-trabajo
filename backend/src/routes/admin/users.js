const express = require('express');
const router = express.Router();
const {
  getUsersList,
  getUserById,
  changeUserRole,
  deleteUser,
  getUsersByRoleStats,
} = require('../../controllers/adminUserController');
const { protect, adminOnly: authAdminOnly } = require('../../middleware/auth');

/**
 * ADMIN ONLY MIDDLEWARE
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Solo admin puede acceder a este recurso' });
  }
  next();
};

/**
 * ADMIN OR DESPACHANTE MIDDLEWARE (for viewing users)
 */
const adminOrDespachante = (req, res, next) => {
  if (!['admin', 'despachante'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Solo admin y despachante pueden acceder a este recurso' });
  }
  next();
};

/**
 * GET /api/admin/users
 * Listar usuarios con filtros (admin y despachante pueden ver lista)
 */
router.get('/', protect, adminOrDespachante, getUsersList);

/**
 * GET /api/admin/users/roles/stats
 * Stats de usuarios por rol
 */
router.get('/roles/stats', protect, adminOnly, getUsersByRoleStats);

/**
 * GET /api/admin/users/:id
 * Obtener detalles de un usuario
 */
router.get('/:id', protect, adminOnly, getUserById);

/**
 * PUT /api/admin/users/:id/role
 * Cambiar rol de usuario
 */
router.put('/:id/role', protect, adminOnly, changeUserRole);

/**
 * DELETE /api/admin/users/:id
 * Desactivar usuario
 */
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
