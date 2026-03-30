import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { BROWSER_MUTATION_HEADER_NAME, BROWSER_MUTATION_HEADER_VALUE } from '@/api/constants/browser-mutation.constants';
import { env } from '@/config/env';
import { withMutationGuards } from '../helpers/mutation-guard.helper';

const LOGIN_URL = '/api/v1/auth/login';

const validUser = {
  email: 'csrf-guard@test.com',
  password: 'Password123',
  nombre_comercial: 'CSRF Test',
  nif: '11111111H',
  direccion_fiscal: 'Calle CSRF 1',
};

describe('Browser mutation guard (Origin + X-Requested-With)', () => {
  const allowedOriginsList = env.ALLOWED_ORIGINS;
  const [allowedOrigin] = allowedOriginsList;
  if (allowedOrigin === undefined) {
    throw new Error(
      'Browser mutation guard tests require ALLOWED_ORIGINS to list at least one origin. Set backend/.env (e.g. http://localhost:8080).',
    );
  }

  beforeEach(async () => {
    await withMutationGuards(request(app).post('/api/v1/auth/register')).send(validUser);
  });

  it('should return 403 when Origin is missing on POST /api', async () => {
    const response = await request(app)
      .post(LOGIN_URL)
      .set(BROWSER_MUTATION_HEADER_NAME, BROWSER_MUTATION_HEADER_VALUE)
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 403 when Origin is not in ALLOWED_ORIGINS', async () => {
    const response = await request(app)
      .post(LOGIN_URL)
      .set('Origin', 'https://evil.example')
      .set(BROWSER_MUTATION_HEADER_NAME, BROWSER_MUTATION_HEADER_VALUE)
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 403 when X-Requested-With is missing', async () => {
    const response = await request(app)
      .post(LOGIN_URL)
      .set('Origin', allowedOrigin)
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow login when Origin and header are valid', async () => {
    const response = await request(app)
      .post(LOGIN_URL)
      .set('Origin', allowedOrigin)
      .set(BROWSER_MUTATION_HEADER_NAME, BROWSER_MUTATION_HEADER_VALUE)
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
