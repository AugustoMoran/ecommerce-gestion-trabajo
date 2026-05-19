const User = require('../models/User');
const logger = require('../utils/logger');

const VALID_ROLES = ['user', 'admin', 'tecnico', 'despachante', 'gremio'];

/**
 * GET /api/admin/users
 * Admin obtiene lista de usuarios con filtros
 */
exports.getUsersList = async (req, res, next) => {
  try {
    const { role, search, limit = 20, skip = 0 } = req.query;

    // Construir filtro
    let filter = { isActive: true };

    if (role && VALID_ROLES.includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { apellido: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments(filter);

    res.json({
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      users,
    });
  } catch (error) {
    logger.error('Error getting users list', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admin/users/:id
 * Admin obtiene detalles de un usuario
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error getting user by id', { error: error.message });
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Admin cambia el rol de un usuario
 */
exports.changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newRole, zone } = req.body;

    // Validar nuevo rol
    if (!VALID_ROLES.includes(newRole)) {
      return res.status(400).json({
        message: `Rol inválido. Roles válidos: ${VALID_ROLES.join(', ')}`,
      });
    }

    // Validar zona si es relevante
    if (['user', 'gremio'].includes(newRole) && zone) {
      if (!['AMBA', 'CABA'].includes(zone)) {
        return res.status(400).json({
          message: 'Zona inválida. Debe ser AMBA o CABA',
        });
      }
    }

    // Obtener usuario
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Guardar rol anterior para log
    const oldRole = user.role;

    // Actualizar rol
    user.role = newRole;
    if (zone) user.zone = zone;

    await user.save();

    logger.info('User role changed', {
      adminId: req.user._id,
      userId: id,
      oldRole,
      newRole,
    });

    res.json({
      message: 'Rol actualizado correctamente',
      user: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
        zone: user.zone,
      },
    });
  } catch (error) {
    logger.error('Error changing user role', { error: error.message });
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Admin desactiva/elimina usuario (soft delete)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Soft delete
    await user.softDelete();

    logger.info('User soft deleted', {
      adminId: req.user._id,
      userId: id,
      email: user.email,
    });

    res.json({
      message: 'Usuario desactivado correctamente',
    });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/admin/users/roles/stats
 * Admin ve estadísticas de usuarios por rol
 */
exports.getUsersByRoleStats = async (req, res, next) => {
  try {
    const stats = {};

    for (const role of VALID_ROLES) {
      stats[role] = await User.countDocuments({ role, isActive: true });
    }

    stats.total = await User.countDocuments({ isActive: true });
    stats.inactive = await User.countDocuments({ isActive: false });

    res.json(stats);
  } catch (error) {
    logger.error('Error getting users stats', { error: error.message });
    next(error);
  }
};
