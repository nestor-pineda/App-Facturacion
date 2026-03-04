import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;
const IS_TEST = process.env.NODE_ENV === 'test';

export const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 100,
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
  limit: 10,
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
