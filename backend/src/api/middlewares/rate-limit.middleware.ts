import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;
const IS_TEST = process.env.NODE_ENV === 'test';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const GENERAL_LIMIT = IS_PRODUCTION ? 100 : 5000;
const AUTH_LIMIT = IS_PRODUCTION ? 10 : 500;

export const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: GENERAL_LIMIT,
  skip: () => IS_TEST,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Demasiadas peticiones, por favor intenta más tarde',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: AUTH_LIMIT,
  skip: () => IS_TEST,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Demasiados intentos de autenticación, por favor intenta más tarde',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});
