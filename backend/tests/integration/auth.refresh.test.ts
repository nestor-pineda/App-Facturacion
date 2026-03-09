import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '@/app';
import { env } from '@/config/env';

const REGISTER_URL = '/api/v1/auth/register';
const LOGIN_URL = '/api/v1/auth/login';
const REFRESH_URL = '/api/v1/auth/refresh';

const validUser = {
  email: 'autonomo@test.com',
  password: 'Password123',
  nombre_comercial: 'Test Autónomo',
  nif: '12345678A',
  direccion_fiscal: 'Calle Test 1, Madrid',
};

describe('POST /api/v1/auth/refresh', () => {
  let refreshToken: string;

  beforeEach(async () => {
    await request(app).post(REGISTER_URL).send(validUser);
    const loginRes = await request(app)
      .post(LOGIN_URL)
      .send({ email: validUser.email, password: validUser.password });
    refreshToken = loginRes.body.data.refreshToken;
  });

  it('should return 200 with a new accessToken on a valid refreshToken', async () => {
    // Act
    const response = await request(app).post(REFRESH_URL).send({ refreshToken });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(typeof response.body.data.accessToken).toBe('string');
    expect(response.body.data).not.toHaveProperty('refreshToken');
  });

  it('should return 400 when refreshToken field is missing', async () => {
    // Act
    const response = await request(app).post(REFRESH_URL).send({});

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 INVALID_TOKEN when token is malformed', async () => {
    // Act
    const response = await request(app)
      .post(REFRESH_URL)
      .send({ refreshToken: 'this.is.not.a.valid.jwt' });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 401 INVALID_TOKEN when token is expired', async () => {
    // Arrange - refresh token con exp en el pasado
    const expiredToken = jwt.sign(
      { userId: 'some-user-id', exp: Math.floor(Date.now() / 1000) - 3600 },
      env.JWT_REFRESH_SECRET,
    );

    // Act
    const response = await request(app).post(REFRESH_URL).send({ refreshToken: expiredToken });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 401 INVALID_TOKEN when an accessToken is used instead of refreshToken', async () => {
    // Arrange - usar el accessToken (firmado con JWT_SECRET) como si fuera refreshToken
    const accessTokenUsedAsRefresh = jwt.sign(
      { userId: 'some-user-id' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    // Act
    const response = await request(app)
      .post(REFRESH_URL)
      .send({ refreshToken: accessTokenUsedAsRefresh });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});
