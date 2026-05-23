const authService = require('../services/authService');
const { generateAccessToken, generateRefreshToken, setRefreshTokenCookie, setAccessTokenCookie, clearRefreshTokenCookie, clearAccessTokenCookie } = require('../utils/generateToken');

const register = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, telefono } = req.body;
    const user = await authService.register({ nombre, apellido, email, password, telefono });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    // Merge guest cart on register
    if (req.body.guestCart) {
      await authService.mergeGuestCart(user._id, req.body.guestCart);
    }

    // Response incluye accessToken también (para fallback en cross-domain)
    // El token primario sigue siendo HTTP-only cookie, esto es backup
    res.status(201).json({
      accessToken, // Incluir token para enviar por Authorization header como fallback
      user: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    // Merge guest cart on login
    if (req.body.guestCart) {
      await authService.mergeGuestCart(user._id, req.body.guestCart);
    }

    // Response incluye accessToken también (para fallback en cross-domain)
    // El token primario sigue siendo HTTP-only cookie, esto es backup
    res.json({
      accessToken, // Incluir token para enviar por Authorization header como fallback
      user: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono,
        zone: user.zone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const oldToken = req.cookies.refreshToken;
    if (!oldToken) {
      return res.status(401).json({ message: 'Refresh token no encontrado.' });
    }

    const { accessToken, refreshToken } = await authService.refreshTokens(oldToken);
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    // Incluir token en response para fallback cross-domain
    res.json({ 
      accessToken, // Para enviar por Authorization header si cookies no funciona
      message: 'Token refreshed' 
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    await authService.logout(token, res);
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);
    res.json({ message: 'Sesión cerrada.' });
  } catch (error) {
    next(error);
  }
};

const getMe = (req, res) => {
  res.json({
    _id: req.user._id,
    nombre: req.user.nombre,
    apellido: req.user.apellido,
    email: req.user.email,
    telefono: req.user.telefono,
    direccion: req.user.direccion,
    role: req.user.role,
    zone: req.user.zone,
    favoritos: req.user.favoritos,
  });
};

module.exports = { register, login, refresh, logout, getMe };
