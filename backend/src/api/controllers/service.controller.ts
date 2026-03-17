import { Request, Response } from 'express';
import { createServiceSchema, updateServiceSchema } from '@/api/schemas/service.schema';
import * as serviceService from '@/services/service.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const list = async (req: Request, res: Response) => {
  try {
    const services = await serviceService.list(req.user!.id);
    return res.status(200).json({ success: true, data: services });
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const create = async (req: Request, res: Response) => {
  const parsed = createServiceSchema.safeParse(req.body);

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
    const service = await serviceService.create(req.user!.id, parsed.data);
    return res.status(201).json({ success: true, data: service });
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const update = async (req: Request, res: Response) => {
  const parsed = updateServiceSchema.safeParse(req.body);

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
    const service = await serviceService.update(req.user!.id, req.params.id as string, parsed.data);
    return res.status(200).json({ success: true, data: service });
  } catch (error) {
    if (error instanceof Error && error.message === serviceService.SERVICE_NOT_FOUND) {
      return res.status(404).json({
        success: false,
        error: { message: 'Servicio no encontrado', code: ERROR_CODES.NOT_FOUND },
      });
    }
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
