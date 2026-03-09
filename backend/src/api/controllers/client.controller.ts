import { Request, Response } from 'express';
import { createClientSchema, updateClientSchema } from '@/api/schemas/client.schema';
import * as clientService from '@/services/client.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const list = async (req: Request, res: Response) => {
  try {
    const { data, total } = await clientService.list(req.user!.id);
    return res.status(200).json({ success: true, data, meta: { total } });
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const create = async (req: Request, res: Response) => {
  const parsed = createClientSchema.safeParse(req.body);

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
    const client = await clientService.create(req.user!.id, parsed.data);
    return res.status(201).json({ success: true, data: client });
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const update = async (req: Request, res: Response) => {
  const parsed = updateClientSchema.safeParse(req.body);

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
    const client = await clientService.update(req.user!.id, req.params.id as string, parsed.data);
    return res.status(200).json({ success: true, data: client });
  } catch (error) {
    if (error instanceof Error && error.message === clientService.CLIENT_NOT_FOUND) {
      return res.status(404).json({
        success: false,
        error: { message: 'Cliente no encontrado', code: ERROR_CODES.NOT_FOUND },
      });
    }

    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
