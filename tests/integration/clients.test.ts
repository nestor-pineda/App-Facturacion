import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { createUserAndGetToken, createSecondUserAndGetToken } from '../helpers/auth.helper';

const CLIENTS_URL = '/api/v1/clients';

const validClient = {
  nombre: 'Empresa Cliente SL',
  email: 'cliente@empresa.com',
  cif_nif: 'B12345678',
  direccion: 'Calle Cliente 10, 28080 Madrid',
};

describe('GET /api/v1/clients', () => {
  it('should return 401 without auth token', async () => {
    const response = await request(app).get(CLIENTS_URL);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should return 200 with empty array when no clients exist', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .get(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.meta).toHaveProperty('total', 0);
  });

  it('should only return clients belonging to the authenticated user', async () => {
    const token1 = await createUserAndGetToken();
    const token2 = await createSecondUserAndGetToken();

    await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token1}`)
      .send(validClient);

    const response = await request(app)
      .get(CLIENTS_URL)
      .set('Authorization', `Bearer ${token2}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });
});

describe('POST /api/v1/clients', () => {
  it('should return 401 without auth token', async () => {
    const response = await request(app).post(CLIENTS_URL).send(validClient);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should create a client and return 201', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.nombre).toBe(validClient.nombre);
    expect(response.body.data.email).toBe(validClient.email);
    expect(response.body.data.cif_nif).toBe(validClient.cif_nif);
  });

  it('should return 400 when required fields are missing', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Solo nombre' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 with invalid email', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validClient, email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/v1/clients/:id', () => {
  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .put(`${CLIENTS_URL}/some-id`)
      .send({ nombre: 'Nuevo Nombre' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should update a client and return 200', async () => {
    const token = await createUserAndGetToken();

    const createRes = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    const clientId = createRes.body.data.id;

    const response = await request(app)
      .put(`${CLIENTS_URL}/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validClient, nombre: 'Nombre Actualizado' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nombre).toBe('Nombre Actualizado');
  });

  it('should return 404 when client does not exist', async () => {
    const token = await createUserAndGetToken();

    const response = await request(app)
      .put(`${CLIENTS_URL}/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 when client belongs to another user', async () => {
    const token1 = await createUserAndGetToken();
    const token2 = await createSecondUserAndGetToken();

    const createRes = await request(app)
      .post(CLIENTS_URL)
      .set('Authorization', `Bearer ${token1}`)
      .send(validClient);

    const clientId = createRes.body.data.id;

    const response = await request(app)
      .put(`${CLIENTS_URL}/${clientId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send(validClient);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
