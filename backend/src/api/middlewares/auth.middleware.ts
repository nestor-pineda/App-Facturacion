import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

const ERROR_CODES = {
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken as string | undefined;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token no proporcionado',
        code: ERROR_CODES.NO_TOKEN,
      },
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.user = { id: decoded.userId };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token inválido o expirado',
        code: ERROR_CODES.INVALID_TOKEN,
      },
    });
  }
};
