import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AUDIT_EVENT } from '@/constants/audit-events.constants';
import { env } from '@/config/env';
import { auditLog } from '@/lib/audit-log';

const ERROR_CODES = {
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

function tokenInvalidReason(err: unknown): 'expired' | 'invalid' {
  if (err instanceof TokenExpiredError) {
    return 'expired';
  }
  if (err instanceof JsonWebTokenError) {
    return 'invalid';
  }
  return 'invalid';
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken as string | undefined;

  if (!token) {
    auditLog(req, AUDIT_EVENT.AUTH_TOKEN_MISSING, { path: req.path });
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
  } catch (err) {
    auditLog(req, AUDIT_EVENT.AUTH_TOKEN_INVALID, {
      path: req.path,
      reason: tokenInvalidReason(err),
    });
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token inválido o expirado',
        code: ERROR_CODES.INVALID_TOKEN,
      },
    });
  }
};
