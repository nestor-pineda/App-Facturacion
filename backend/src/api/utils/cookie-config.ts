import { CookieOptions } from 'express';
import { env } from '@/config/env';

export const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const getCookieOptions = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge,
});
