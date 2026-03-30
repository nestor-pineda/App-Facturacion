import { Request, Response } from 'express';
import { replyInvalidUuidParams, safeParseUuidParams } from '@/api/schemas/params.schema';
import { createClientSchema, updateClientSchema } from '@/api/schemas/client.schema';
import { AUDIT_EVENT, RESOURCE_KIND } from '@/constants/audit-events.constants';
import { auditLog } from '@/lib/audit-log';
import { logControllerError } from '@/lib/log-controller-error';
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
  } catch (error) {
    logControllerError(req, 'client.list', error);
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
  } catch (error) {
    const err = error as { code?: string; meta?: { target?: string[] }; message?: string };
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Ya existe un cliente con ese email para tu cuenta.',
          code: 'EMAIL_ALREADY_EXISTS',
        },
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Error de referencia (usuario o datos inválidos). Vuelve a iniciar sesión.',
          code: 'FOREIGN_KEY_ERROR',
        },
      });
    }
    logControllerError(req, 'client.create', error);
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
    const client = await clientService.update(req.user!.id, paramsParsed.data.id, parsed.data);
    return res.status(200).json({ success: true, data: client });
  } catch (error) {
    if (error instanceof Error && error.message === clientService.CLIENT_NOT_FOUND) {
      auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
        userId: req.user!.id,
        resourceKind: RESOURCE_KIND.CLIENT,
        resourceId: paramsParsed.data.id,
      });
      return res.status(404).json({
        success: false,
        error: { message: 'Cliente no encontrado', code: ERROR_CODES.NOT_FOUND },
      });
    }

    logControllerError(req, 'client.update', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
