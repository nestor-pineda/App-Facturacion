import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import {
  parseInvoiceListQuery,
  replyInvalidDocumentListQuery,
  replyInvalidUuidParams,
  safeParseUuidParams,
} from '@/api/schemas/params.schema';
import { AUDIT_EVENT, RESOURCE_KIND } from '@/constants/audit-events.constants';
import { auditLog } from '@/lib/audit-log';
import { logControllerError } from '@/lib/log-controller-error';
import { createInvoiceSchema, updateInvoiceSchema } from '@/api/schemas/document.schema';
import { patchSendBodySchema } from '@/api/schemas/send-confirmation.schema';
import {
  RELATED_CLIENT_NOT_FOUND,
  RELATED_SERVICE_NOT_FOUND,
} from '@/services/document-ownership.service';
import * as invoiceService from '@/services/invoice.service';
import {
  INVALID_SEND_CONFIRMATION,
  issueSendConfirmationToken,
  SEND_CONFIRMATION_PURPOSE_INVOICE,
  verifySendConfirmationToken,
} from '@/services/send-confirmation-token.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_SENT: 'ALREADY_SENT',
  NUMERO_CONFLICT: 'NUMERO_CONFLICT',
  INVALID_SEND_CONFIRMATION: 'INVALID_SEND_CONFIRMATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const list = async (req: Request, res: Response) => {
  const queryParsed = parseInvoiceListQuery(req.query);
  if (!queryParsed.success) {
    replyInvalidDocumentListQuery(res, queryParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  const { estado, client_id, desde, hasta } = queryParsed.data;

  try {
    const invoices = await invoiceService.list(req.user!.id, {
      estado,
      client_id,
      desde,
      hasta,
    });
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    logControllerError(req, 'invoice.list', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const create = async (req: Request, res: Response) => {
  const parsed = createInvoiceSchema.safeParse(req.body);

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
    const invoice = await invoiceService.create(req.user!.id, parsed.data);
    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === RELATED_CLIENT_NOT_FOUND || error.message === RELATED_SERVICE_NOT_FOUND)
    ) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Cliente o servicio no encontrado o no pertenece a tu cuenta.',
          code: ERROR_CODES.NOT_FOUND,
        },
      });
    }
    logControllerError(req, 'invoice.create', error);
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

  const parsed = updateInvoiceSchema.safeParse(req.body);

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
    const invoice = await invoiceService.update(req.user!.id, paramsParsed.data.id, parsed.data);
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
          userId: req.user!.id,
          resourceKind: RESOURCE_KIND.INVOICE,
          resourceId: paramsParsed.data.id,
        });
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === invoiceService.ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'La factura ya fue enviada y no puede modificarse', code: ERROR_CODES.ALREADY_SENT },
        });
      }

      if (error.message === RELATED_CLIENT_NOT_FOUND || error.message === RELATED_SERVICE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Cliente o servicio no encontrado o no pertenece a tu cuenta.',
            code: ERROR_CODES.NOT_FOUND,
          },
        });
      }
    }

    logControllerError(req, 'invoice.update', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  const paramsParsed = safeParseUuidParams(req.params);
  if (!paramsParsed.success) {
    replyInvalidUuidParams(res, paramsParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  try {
    await invoiceService.remove(req.user!.id, paramsParsed.data.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
          userId: req.user!.id,
          resourceKind: RESOURCE_KIND.INVOICE,
          resourceId: paramsParsed.data.id,
        });
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === invoiceService.ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'La factura ya fue enviada y no puede eliminarse', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }

    logControllerError(req, 'invoice.remove', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const issueSendConfirmation = async (req: Request, res: Response) => {
  const paramsParsed = safeParseUuidParams(req.params);
  if (!paramsParsed.success) {
    replyInvalidUuidParams(res, paramsParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  const id = paramsParsed.data.id;
  const userId = req.user!.id;

  try {
    await invoiceService.assertInvoiceCanRequestSendConfirmation(userId, id);
    const confirmationToken = issueSendConfirmationToken(SEND_CONFIRMATION_PURPOSE_INVOICE, userId, id);
    auditLog(req, AUDIT_EVENT.DOCUMENT_SEND_CONFIRMATION_ISSUED, {
      userId,
      resourceKind: RESOURCE_KIND.INVOICE,
      resourceId: id,
    });
    return res.status(200).json({ success: true, data: { confirmationToken } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
          userId,
          resourceKind: RESOURCE_KIND.INVOICE,
          resourceId: id,
        });
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }
      if (error.message === invoiceService.ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'Factura ya enviada', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }
    logControllerError(req, 'invoice.issueSendConfirmation', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const send = async (req: Request, res: Response) => {
  const paramsParsed = safeParseUuidParams(req.params);
  if (!paramsParsed.success) {
    replyInvalidUuidParams(res, paramsParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  const bodyParsed = patchSendBodySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: bodyParsed.error.flatten(),
      },
    });
  }

  const id = paramsParsed.data.id;
  const userId = req.user!.id;

  try {
    verifySendConfirmationToken(
      bodyParsed.data.confirmationToken,
      SEND_CONFIRMATION_PURPOSE_INVOICE,
      userId,
      id,
    );
    const invoice = await invoiceService.send(userId, id);
    auditLog(req, AUDIT_EVENT.DOCUMENT_SENT, {
      userId,
      resourceKind: RESOURCE_KIND.INVOICE,
      resourceId: id,
      numero: invoice.numero ?? undefined,
    });
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_SEND_CONFIRMATION) {
      auditLog(req, AUDIT_EVENT.DOCUMENT_SEND_CONFIRMATION_REJECTED, {
        userId,
        resourceKind: RESOURCE_KIND.INVOICE,
        resourceId: id,
      });
      return res.status(403).json({
        success: false,
        error: {
          message: 'Token de confirmación inválido o caducado. Solicita uno nuevo desde la app.',
          code: ERROR_CODES.INVALID_SEND_CONFIRMATION,
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'No se pudo asignar un número de factura único. Vuelve a intentarlo.',
          code: ERROR_CODES.NUMERO_CONFLICT,
        },
      });
    }

    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
          userId,
          resourceKind: RESOURCE_KIND.INVOICE,
          resourceId: id,
        });
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === invoiceService.ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'Factura ya enviada', code: ERROR_CODES.ALREADY_SENT },
        });
      }

      if (error.message === invoiceService.INVOICE_NUMERO_ASSIGNMENT_EXHAUSTED) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'No se pudo asignar un número de factura único. Vuelve a intentarlo.',
            code: ERROR_CODES.NUMERO_CONFLICT,
          },
        });
      }
    }

    logControllerError(req, 'invoice.send', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const resend = async (req: Request, res: Response) => {
  const paramsParsed = safeParseUuidParams(req.params);
  if (!paramsParsed.success) {
    replyInvalidUuidParams(res, paramsParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  try {
    const invoice = await invoiceService.resendInvoiceEmail(req.user!.id, paramsParsed.data.id);
    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error && error.message === invoiceService.INVOICE_NOT_FOUND) {
      auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
        userId: req.user!.id,
        resourceKind: RESOURCE_KIND.INVOICE,
        resourceId: paramsParsed.data.id,
      });
      return res.status(404).json({
        success: false,
        error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
      });
    }
    logControllerError(req, 'invoice.resend', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const copy = async (req: Request, res: Response) => {
  const paramsParsed = safeParseUuidParams(req.params);
  if (!paramsParsed.success) {
    replyInvalidUuidParams(res, paramsParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  try {
    const invoice = await invoiceService.copyInvoice(req.user!.id, paramsParsed.data.id);
    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === invoiceService.INVOICE_NOT_FOUND) {
        auditLog(req, AUDIT_EVENT.RESOURCE_ACCESS_NOT_FOUND, {
          userId: req.user!.id,
          resourceKind: RESOURCE_KIND.INVOICE,
          resourceId: paramsParsed.data.id,
        });
        return res.status(404).json({
          success: false,
          error: { message: 'Factura no encontrada', code: ERROR_CODES.NOT_FOUND },
        });
      }
    }
    logControllerError(req, 'invoice.copy', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
