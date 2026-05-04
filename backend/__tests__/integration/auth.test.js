/**
 * Integration tests for auth routes.
 *
 * Uses Supertest to hit the Express app directly.
 * Requires a running MongoDB (or use mongodb-memory-server for full isolation).
 *
 * For now these tests run against the real DB (MONGO_URI from .env.test if present).
 * To run: npm test
 */

'use strict';

// Use a test env file if present
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Set MONGO_URI in .env before running integration tests');
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  const testEmail = `test_${Date.now()}@example.com`;

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBe(400);
  });

  it('creates a new user and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test',
      apellido: 'Integration',
      email: testEmail,
      password: 'Password1!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toMatchObject({ email: testEmail });
  });

  it('returns 400 when email is already taken', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test',
      apellido: 'Integration',
      email: testEmail, // same email as above
      password: 'Password1!',
    });

    expect(res.statusCode).toBe(400);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });
});
