import { Request, Response } from 'express';
import { replyInvalidUuidParams, safeParseUuidParams } from '@/api/schemas/params.schema';
import { createServiceSchema, updateServiceSchema } from '@/api/schemas/service.schema';
import { AUDIT_EVENT, RESOURCE_KIND } from '@/constants/audit-events.constants';
import { auditLog } from '@/lib/audit-log';
import { logControllerError } from '@/lib/log-controller-error';
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
  } catch (error) {
    logControllerError(req, 'service.list', error);
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
  } catch (error) {
    logControllerError(req, 'service.create', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const update = async (req: Request, res: Response) => {
  const paramsParsed = safeParseUuidParams(req.params);
  if (!paramsParsed.success) {
    replyInvalidUuidParams(res, paramsParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

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
    const service = await serviceService.update(req.user!.id, paramsParsed.data.id, parsed.data);
    return res.status(200).json({ success: true, data: service });
  } catch (error) {
    if (error instanceof Error && error.message === serviceService.SERVICE_NOT_FOUND) {
      auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
        userId: req.user!.id,
        resourceKind: RESOURCE_KIND.SERVICE,
        resourceId: paramsParsed.data.id,
      });
      return res.status(404).json({
        success: false,
        error: { message: 'Servicio no encontrado', code: ERROR_CODES.NOT_FOUND },
      });
    }
    logControllerError(req, 'service.update', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
