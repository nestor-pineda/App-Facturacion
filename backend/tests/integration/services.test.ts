import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { createUserAndGetToken, createSecondUserAndGetToken } from '../helpers/auth.helper';

const SERVICES_URL = '/api/v1/services';

const validService = {
  nombre: 'Consultoría técnica',
  descripcion: 'Servicio de consultoría por hora',
  precio_base: 75.0,
};

describe('GET /api/v1/services', () => {
  it('should return 401 without auth token', async () => {
    const response = await request(app).get(SERVICES_URL);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should return 200 with empty array when no services exist', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .get(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should only return services belonging to the authenticated user', async () => {
    const token1 = await createUserAndGetToken();
    const token2 = await createSecondUserAndGetToken();

    await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token1}`)
      .send(validService);

    const response = await request(app)
      .get(SERVICES_URL)
      .set('Authorization', `Bearer ${token2}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });
});

describe('POST /api/v1/services', () => {
  it('should return 401 without auth token', async () => {
    const response = await request(app).post(SERVICES_URL).send(validService);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should create a service and return 201 with default IVA 21%', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validService);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.nombre).toBe(validService.nombre);
    expect(Number(response.body.data.precio_base)).toBe(validService.precio_base);
    expect(Number(response.body.data.iva_porcentaje)).toBe(21);
  });

  it('should create a service with custom IVA', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validService, iva_porcentaje: 10 });

    expect(response.status).toBe(201);
    expect(Number(response.body.data.iva_porcentaje)).toBe(10);
  });

  it('should return 400 when required fields are missing', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Solo nombre' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when precio_base is not a positive number', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validService, precio_base: -10 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
