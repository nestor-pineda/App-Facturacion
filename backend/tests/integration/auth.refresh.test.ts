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
  let loginCookies: string[];

  beforeEach(async () => {
    await request(app).post(REGISTER_URL).send(validUser);
    const loginRes = await request(app)
      .post(LOGIN_URL)
      .send({ email: validUser.email, password: validUser.password });
    loginCookies = loginRes.headers['set-cookie'] as string[];
  });

  it('should set a new accessToken cookie on a valid refreshToken cookie', async () => {
    // Act
    const response = await request(app)
      .post(REFRESH_URL)
      .set('Cookie', loginCookies);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('message');
    expect(response.body.data).not.toHaveProperty('accessToken');

    const cookies: string[] = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('should return 401 NO_REFRESH_TOKEN when no cookie is sent', async () => {
    // Act
    const response = await request(app).post(REFRESH_URL);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NO_REFRESH_TOKEN');
  });

  it('should return 401 INVALID_TOKEN when refreshToken cookie is malformed', async () => {
    // Act
    const response = await request(app)
      .post(REFRESH_URL)
      .set('Cookie', ['refreshToken=this.is.not.a.valid.jwt']);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 401 INVALID_TOKEN when refreshToken cookie is expired', async () => {
    // Arrange - expired refresh token
    const expiredToken = jwt.sign(
      { userId: 'some-user-id', exp: Math.floor(Date.now() / 1000) - 3600 },
      env.JWT_REFRESH_SECRET,
    );

    // Act
    const response = await request(app)
      .post(REFRESH_URL)
      .set('Cookie', [`refreshToken=${expiredToken}`]);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('should return 401 INVALID_TOKEN when an accessToken is used as refreshToken cookie', async () => {
    // Arrange - accessToken signed with JWT_SECRET, not JWT_REFRESH_SECRET
    const accessTokenUsedAsRefresh = jwt.sign(
      { userId: 'some-user-id' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    // Act
    const response = await request(app)
      .post(REFRESH_URL)
      .set('Cookie', [`refreshToken=${accessTokenUsedAsRefresh}`]);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});
