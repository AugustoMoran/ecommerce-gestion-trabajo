const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const RefreshToken = require('../models/RefreshToken');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = async (userId) => {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({ token, usuario: userId, expiresAt });
  return token;
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: false, // Always false for localhost (HTTP), secure: true is for production HTTPS
    sameSite: 'Lax', // Lax works best for localhost development
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const setAccessTokenCookie = (res, token) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: false, // Always false for localhost (HTTP), secure: true is for production HTTPS
    sameSite: 'Lax', // Lax works best for localhost development
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/' });
};

const clearAccessTokenCookie = (res) => {
  res.clearCookie('accessToken', { path: '/' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  setAccessTokenCookie,
  clearRefreshTokenCookie,
  clearAccessTokenCookie,
};
