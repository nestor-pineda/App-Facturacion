import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { withMutationGuards } from '../helpers/mutation-guard.helper';
import app from '@/app';

const REGISTER_URL = '/api/v1/auth/register';

const validPayload = {
  email: 'autonomo@test.com',
  password: 'Password123',
  nombre_comercial: 'Test Autónomo',
  nif: '12345678A',
  direccion_fiscal: 'Calle Test 1, Madrid',
};

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return 201', async () => {
    // Act
    const response = await withMutationGuards(request(app).post(REGISTER_URL)).send(validPayload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user.email).toBe(validPayload.email);
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  it('should return 400 with invalid email', async () => {
    // Arrange
    const invalidPayload = { ...validPayload, email: 'not-an-email' };

    // Act
    const response = await withMutationGuards(request(app).post(REGISTER_URL)).send(invalidPayload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 with password shorter than 8 characters', async () => {
    // Arrange
    const invalidPayload = { ...validPayload, password: 'short' };

    // Act
    const response = await withMutationGuards(request(app).post(REGISTER_URL)).send(invalidPayload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when required fields are missing', async () => {
    // Arrange - only email and password, missing nif and direccion_fiscal
    const incompletePayload = { email: 'test@test.com', password: 'Password123' };

    // Act
    const response = await withMutationGuards(request(app).post(REGISTER_URL)).send(incompletePayload);

    // Assert
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 409 when email is already registered', async () => {
    // Arrange - first registration
    await withMutationGuards(request(app).post(REGISTER_URL)).send(validPayload);

    // Act - second registration with the same email
    const response = await withMutationGuards(request(app).post(REGISTER_URL)).send(validPayload);

    // Assert
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });
});
