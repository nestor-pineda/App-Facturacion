import request from 'supertest';
import app from '@/app';

const REGISTER_URL = '/api/v1/auth/register';
const LOGIN_URL = '/api/v1/auth/login';

const DEFAULT_USER = {
  email: 'autonomo@test.com',
  password: 'Password123',
  nombre_comercial: 'Test Autónomo',
  nif: '12345678A',
  direccion_fiscal: 'Calle Test 1, Madrid',
};

const SECOND_USER = {
  email: 'otro@test.com',
  password: 'Password123',
  nombre_comercial: 'Otro Autónomo',
  nif: '87654321B',
  direccion_fiscal: 'Calle Otra 2, Barcelona',
};

export const createUserAndGetCookies = async (
  user: typeof DEFAULT_USER = DEFAULT_USER,
): Promise<string[]> => {
  await request(app).post(REGISTER_URL).send(user);
  const res = await request(app)
    .post(LOGIN_URL)
    .send({ email: user.email, password: user.password });
  return res.headers['set-cookie'] as string[];
};

export const createSecondUserAndGetCookies = async (): Promise<string[]> => {
  return createUserAndGetCookies(SECOND_USER);
};
