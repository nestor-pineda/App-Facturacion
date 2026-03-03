import { Request, Response } from 'express';
import { registerSchema } from '../schemas/auth.schema';
import * as authService from '../../services/auth.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
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
