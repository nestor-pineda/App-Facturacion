import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';
import {
  BROWSER_MUTATION_HEADER_NAME,
  BROWSER_MUTATION_HEADER_VALUE,
} from '@/api/constants/browser-mutation.constants';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const API_PREFIX = '/api';

const FORBIDDEN_ORIGIN = {
  success: false,
  error: {
    message: 'Origen de la petición no permitido',
    code: 'FORBIDDEN',
  },
} as const;

const FORBIDDEN_HEADER = {
  success: false,
  error: {
    message: 'Cabecera de seguridad requerida ausente o incorrecta',
    code: 'FORBIDDEN',
  },
} as const;

export const parseAllowedOriginsList = (raw: string): string[] =>
  raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  return allowed.includes(origin);
}

function originFromReferer(referer: string, allowed: string[]): string | null {
  try {
    const o = new URL(referer).origin;
    return isAllowedOrigin(o, allowed) ? o : null;
  } catch {
    return null;
  }
}

function resolveTrustedOrigin(req: Request, allowed: string[]): string | null {
  const originHeader = req.get('Origin');
  if (originHeader && isAllowedOrigin(originHeader, allowed)) {
    return originHeader;
  }
  const referer = req.get('Referer');
  if (referer) {
    return originFromReferer(referer, allowed);
  }
  return null;
}

/**
 * Para POST/PUT/PATCH/DELETE bajo /api: exige Origin o Referer en ALLOWED_ORIGINS y cabecera X-Requested-With.
 * Alineado con la política CORS (mismos orígenes). OPTIONS la gestiona cors antes de llegar aquí.
 */
export const browserMutationGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }
  if (!req.path.startsWith(API_PREFIX)) {
    return next();
  }

  const allowed = parseAllowedOriginsList(env.ALLOWED_ORIGINS);
  if (resolveTrustedOrigin(req, allowed) == null) {
    return res.status(403).json(FORBIDDEN_ORIGIN);
  }

  if (req.get(BROWSER_MUTATION_HEADER_NAME) !== BROWSER_MUTATION_HEADER_VALUE) {
    return res.status(403).json(FORBIDDEN_HEADER);
  }

  return next();
};
