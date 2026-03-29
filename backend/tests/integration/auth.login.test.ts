import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { withMutationGuards } from '../helpers/mutation-guard.helper';
import app from '@/app';

const REGISTER_URL = '/api/v1/auth/register';
const LOGIN_URL = '/api/v1/auth/login';

const validUser = {
  email: 'autonomo@test.com',
  password: 'Password123',
  nombre_comercial: 'Test Autónomo',
  nif: '12345678A',
  direccion_fiscal: 'Calle Test 1, Madrid',
};

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await withMutationGuards(request(app).post(REGISTER_URL)).send(validUser);
  });

  it('should set httpOnly cookies and return user on valid credentials', async () => {
    // Act
    const response = await withMutationGuards(request(app)
      .post(LOGIN_URL))
      .send({ email: validUser.email, password: validUser.password });

    // Assert - status and body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('email', validUser.email);
    expect(response.body.data).not.toHaveProperty('accessToken');
    expect(response.body.data).not.toHaveProperty('refreshToken');

    // Assert - cookies
    const cookies: string[] = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    expect(cookies.every((c) => c.includes('HttpOnly'))).toBe(true);
    expect(cookies.every((c) => c.includes('SameSite=Strict'))).toBe(true);
  });

  it('should return 401 with wrong password', async () => {
    // Act
    const response = await withMutationGuards(request(app)
      .post(LOGIN_URL))
      .send({ email: validUser.email, password: 'WrongPassword99' });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('should return 401 with non-existent email', async () => {
    // Act
    const response = await withMutationGuards(request(app)
      .post(LOGIN_URL))
      .send({ email: 'noexiste@test.com', password: validUser.password });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 400 with invalid email format', async () => {
    // Act
    const response = await withMutationGuards(request(app)
      .post(LOGIN_URL))
      .send({ email: 'not-an-email', password: validUser.password });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when fields are missing', async () => {
    // Act
    const response = await withMutationGuards(request(app).post(LOGIN_URL)).send({});

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
