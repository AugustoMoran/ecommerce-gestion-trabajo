/**
 * Unit tests for authService.
 *
 * These tests mock the database models so no real MongoDB connection is needed.
 */

'use strict';

jest.mock('../../src/models/User');
jest.mock('../../src/models/RefreshToken');
jest.mock('../../src/models/Cart');
jest.mock('../../src/utils/generateToken');

const User = require('../../src/models/User');
const authService = require('../../src/services/authService');

// ─── register ────────────────────────────────────────────────────────────────

describe('authService.register', () => {
  afterEach(() => jest.clearAllMocks());

  it('throws 400 when email already exists', async () => {
    User.findOne.mockResolvedValue({ email: 'a@b.com' });

    await expect(
      authService.register({ nombre: 'A', apellido: 'B', email: 'a@b.com', password: '123' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates and returns a new user', async () => {
    User.findOne.mockResolvedValue(null);
    const mockUser = { _id: 'uid', email: 'new@b.com' };
    User.create.mockResolvedValue(mockUser);

    const result = await authService.register({
      nombre: 'Test',
      apellido: 'User',
      email: 'new@b.com',
      password: 'Password1!',
    });

    expect(User.create).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockUser);
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  afterEach(() => jest.clearAllMocks());

  it('throws 401 when user not found', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await expect(authService.login('noone@b.com', 'pass')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 when password is wrong', async () => {
    const mockUser = { comparePassword: jest.fn().mockResolvedValue(false) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

    await expect(authService.login('a@b.com', 'wrongpass')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('returns user when credentials are correct', async () => {
    const mockUser = { _id: 'uid', comparePassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

    const result = await authService.login('a@b.com', 'correct');
    expect(result).toBe(mockUser);
  });
});
