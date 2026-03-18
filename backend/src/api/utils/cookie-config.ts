import { CookieOptions } from 'express';
import { env } from '@/config/env';

export const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Production: SPA (e.g. Vercel) and API (e.g. Render) are different sites.
 * SameSite=Strict/Lax blocks cookies on cross-origin XHR; None + Secure is required.
 * Prefer JSON APIs + CORS; review CSRF for cookie-authenticated state-changing routes.
 */
export const getCookieOptions = (maxAge: number): CookieOptions => {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge,
  };
};
