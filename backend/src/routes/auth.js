const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const {
  register, login, refresh, logout, getMe,
} = require('../controllers/authController');

router.post(
  '/register',
  authLimiter,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
    body('email').isEmail().normalizeEmail({ gmail: false, gmail_remove_dots: false }).withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail({ gmail: false, gmail_remove_dots: false }),
    body('password').notEmpty(),
  ],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
