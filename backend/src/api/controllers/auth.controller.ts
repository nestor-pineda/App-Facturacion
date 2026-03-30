import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '@/api/schemas/auth.schema';
import * as authService from '@/services/auth.service';
import {
  getCookieOptions,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@/api/utils/cookie-config';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  NO_REFRESH_TOKEN: 'NO_REFRESH_TOKEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: parsed.error.flatten(),
      },
    });
  }

  try {
    const user = await authService.register(parsed.data);
    return res.status(201).json({ success: true, data: { user } });
  } catch (error) {
    if (error instanceof Error && error.message === authService.EMAIL_ALREADY_EXISTS) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'El email ya está registrado',
          code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: ERROR_CODES.INTERNAL_ERROR,
      },
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: parsed.error.flatten(),
      },
    });
  }

  try {
    const { user, accessToken, refreshToken } = await authService.login(parsed.data);

    res.cookie('accessToken', accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
    res.cookie('refreshToken', refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));

    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    if (error instanceof Error && error.message === authService.INVALID_CREDENTIALS) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Credenciales inválidas',
          code: ERROR_CODES.INVALID_CREDENTIALS,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: ERROR_CODES.INTERNAL_ERROR,
      },
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Refresh token requerido',
        code: ERROR_CODES.NO_REFRESH_TOKEN,
      },
    });
  }

  try {
    const { accessToken } = await authService.refresh(refreshToken);

    res.cookie('accessToken', accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));

    return res.status(200).json({
      success: true,
      data: { message: 'Token renovado correctamente' },
    });
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

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  await authService.logout(refreshToken);

  res.clearCookie('accessToken', getCookieOptions(0));
  res.clearCookie('refreshToken', getCookieOptions(0));

  return res.status(200).json({
    success: true,
    data: { message: 'Sesión cerrada correctamente' },
  });
};
