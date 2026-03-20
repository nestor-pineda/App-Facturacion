import { Request, Response } from 'express';
import { updateProfileSchema } from '@/api/schemas/auth.schema';
import * as userService from '@/services/user.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const updateCurrentUser = async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);

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
    const user = await userService.updateCurrentUser(req.user!.id, parsed.data);
    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    if (error instanceof Error && error.message === userService.EMAIL_ALREADY_EXISTS) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'El email ya está registrado',
          code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
        },
      });
    }

    if (error instanceof Error && error.message === userService.USER_NOT_FOUND) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Sesión inválida',
          code: ERROR_CODES.INVALID_TOKEN,
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
