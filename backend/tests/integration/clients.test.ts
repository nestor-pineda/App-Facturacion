import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { withMutationGuards } from '../helpers/mutation-guard.helper';
import app from '@/app';
import { createUserAndGetCookies, createSecondUserAndGetCookies } from '../helpers/auth.helper';

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
    const cookies = await createUserAndGetCookies();

    const response = await request(app)
      .get(CLIENTS_URL)
      .set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.meta).toHaveProperty('total', 0);
  });

  it('should only return clients belonging to the authenticated user', async () => {
    const cookies1 = await createUserAndGetCookies();
    const cookies2 = await createSecondUserAndGetCookies();

    await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies1)
      .send(validClient);

    const response = await request(app)
      .get(CLIENTS_URL)
      .set('Cookie', cookies2);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });
});

describe('POST /api/v1/clients', () => {
  it('should return 401 without auth token', async () => {
    const response = await withMutationGuards(request(app).post(CLIENTS_URL)).send(validClient);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should create a client and return 201', async () => {
    const cookies = await createUserAndGetCookies();

    const response = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.nombre).toBe(validClient.nombre);
    expect(response.body.data.email).toBe(validClient.email);
    expect(response.body.data.cif_nif).toBe(validClient.cif_nif);
  });

  it('should return 400 when required fields are missing', async () => {
    const cookies = await createUserAndGetCookies();

    const response = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send({ nombre: 'Solo nombre' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 with invalid email', async () => {
    const cookies = await createUserAndGetCookies();

    const response = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send({ ...validClient, email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it.skip('should return 409 when creating client with duplicate email for same user (requires @@unique([user_id, email]) on Client)', async () => {
    const cookies = await createUserAndGetCookies();
    const duplicateEmail = 'duplicado@empresa.com';
    const clientPayload = { ...validClient, email: duplicateEmail };

    await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(clientPayload)
      .expect(201);

    const response = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(clientPayload);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(response.body.error.message).toMatch(/email|ya existe/i);
  });
});

describe('PUT /api/v1/clients/:id', () => {
  it('should return 401 without auth token', async () => {
    const response = await withMutationGuards(request(app)
      .put(`${CLIENTS_URL}/some-id`))
      .send({ nombre: 'Nuevo Nombre' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });

  it('should update a client and return 200', async () => {
    const cookies = await createUserAndGetCookies();

    const createRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies)
      .send(validClient);

    const clientId = createRes.body.data.id;

    const response = await withMutationGuards(request(app)
      .put(`${CLIENTS_URL}/${clientId}`))
      .set('Cookie', cookies)
      .send({ ...validClient, nombre: 'Nombre Actualizado' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nombre).toBe('Nombre Actualizado');
  });

  it('should return 404 when client does not exist', async () => {
    const cookies = await createUserAndGetCookies();

    const response = await withMutationGuards(request(app)
      .put(`${CLIENTS_URL}/00000000-0000-0000-0000-000000000000`))
      .set('Cookie', cookies)
      .send(validClient);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 when client belongs to another user', async () => {
    const cookies1 = await createUserAndGetCookies();
    const cookies2 = await createSecondUserAndGetCookies();

    const createRes = await withMutationGuards(request(app)
      .post(CLIENTS_URL))
      .set('Cookie', cookies1)
      .send(validClient);

    const clientId = createRes.body.data.id;

    const response = await withMutationGuards(request(app)
      .put(`${CLIENTS_URL}/${clientId}`))
      .set('Cookie', cookies2)
      .send(validClient);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
