import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';

const REGISTER_URL = '/api/v1/auth/register';
const LOGIN_URL = '/api/v1/auth/login';
const UPDATE_ME_URL = '/api/v1/users/me';

const userPayload = {
  email: 'perfil1@test.com',
  password: 'Password123',
  nombre_comercial: 'Mi Negocio',
  nif: '12345678A',
  direccion_fiscal: 'Calle Uno 1',
  telefono: '+34600000001',
};

const secondUserPayload = {
  email: 'perfil2@test.com',
  password: 'Password123',
  nombre_comercial: 'Otro Negocio',
  nif: '87654321B',
  direccion_fiscal: 'Calle Dos 2',
  telefono: '+34600000002',
};

describe('PATCH /api/v1/users/me', () => {
  beforeEach(async () => {
    await request(app).post(REGISTER_URL).send(userPayload);
  });

  it('should update current user profile and return 200', async () => {
    const loginResponse = await request(app)
      .post(LOGIN_URL)
      .send({ email: userPayload.email, password: userPayload.password });
    const cookies = loginResponse.headers['set-cookie'];

    const updatePayload = {
      email: 'perfil1.updated@test.com',
      nombre_comercial: 'Negocio Actualizado',
      nif: '11111111C',
      direccion_fiscal: 'Calle Nueva 123',
      telefono: '+34699999999',
    };

    const response = await request(app)
      .patch(UPDATE_ME_URL)
      .set('Cookie', cookies)
      .send(updatePayload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(updatePayload.email);
    expect(response.body.data.user.nombre_comercial).toBe(updatePayload.nombre_comercial);
    expect(response.body.data.user.nif).toBe(updatePayload.nif);
    expect(response.body.data.user.direccion_fiscal).toBe(updatePayload.direccion_fiscal);
    expect(response.body.data.user.telefono).toBe(updatePayload.telefono);
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  it('should return 401 when request is unauthenticated', async () => {
    const response = await request(app).patch(UPDATE_ME_URL).send({
      email: 'noauth@test.com',
      nombre_comercial: 'No Auth',
      nif: '12312312A',
      direccion_fiscal: 'No Auth St',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NO_TOKEN');
  });


  it('should return 400 for invalid payload', async () => {
    const loginResponse = await request(app)
      .post(LOGIN_URL)
      .send({ email: userPayload.email, password: userPayload.password });
    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app)
      .patch(UPDATE_ME_URL)
      .set('Cookie', cookies)
      .send({
        email: 'bad-email',
        nombre_comercial: '',
        nif: '',
        direccion_fiscal: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 409 when email is already taken', async () => {
    await request(app).post(REGISTER_URL).send(secondUserPayload);

    const loginResponse = await request(app)
      .post(LOGIN_URL)
      .send({ email: userPayload.email, password: userPayload.password });
    const cookies = loginResponse.headers['set-cookie'];

    const response = await request(app)
      .patch(UPDATE_ME_URL)
      .set('Cookie', cookies)
      .send({
        email: secondUserPayload.email,
        nombre_comercial: 'Negocio Nuevo',
        nif: '22222222D',
        direccion_fiscal: 'Otra dirección',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });
});
