import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { createUserAndGetCookies, createSecondUserAndGetCookies } from '../helpers/auth.helper';

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
    const cookies = await createUserAndGetCookies();

    const response = await request(app)
      .get(SERVICES_URL)
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should only return services belonging to the authenticated user', async () => {
    const cookies1 = await createUserAndGetCookies();
    const cookies2 = await createSecondUserAndGetCookies();

    await request(app)
      .post(SERVICES_URL)
      .set('Cookie', cookies1)
      .send(validService);

    const response = await request(app)
      .get(SERVICES_URL)
      .set('Cookie', cookies2);

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
    const cookies = await createUserAndGetCookies();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Cookie', cookies)
      .send(validService);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.nombre).toBe(validService.nombre);
    expect(Number(response.body.data.precio_base)).toBe(validService.precio_base);
    expect(Number(response.body.data.iva_porcentaje)).toBe(21);
  });

  it('should create a service with custom IVA', async () => {
    const cookies = await createUserAndGetCookies();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Cookie', cookies)
      .send({ ...validService, iva_porcentaje: 10 });

    expect(response.status).toBe(201);
    expect(Number(response.body.data.iva_porcentaje)).toBe(10);
  });

  it('should return 400 when required fields are missing', async () => {
    const cookies = await createUserAndGetCookies();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Cookie', cookies)
      .send({ nombre: 'Solo nombre' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when precio_base is not a positive number', async () => {
    const cookies = await createUserAndGetCookies();

    const response = await request(app)
      .post(SERVICES_URL)
      .set('Cookie', cookies)
      .send({ ...validService, precio_base: -10 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
