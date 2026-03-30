import { Request, Response } from 'express';
import {
  parseQuoteListQuery,
  replyInvalidDocumentListQuery,
  replyInvalidUuidParams,
  safeParseUuidParams,
} from '@/api/schemas/params.schema';
import { createQuoteSchema, updateQuoteSchema, convertQuoteSchema } from '@/api/schemas/document.schema';
import { patchSendBodySchema } from '@/api/schemas/send-confirmation.schema';
import {
  RELATED_CLIENT_NOT_FOUND,
  RELATED_SERVICE_NOT_FOUND,
} from '@/services/document-ownership.service';
import * as quoteService from '@/services/quote.service';
import {
  INVALID_SEND_CONFIRMATION,
  issueSendConfirmationToken,
  SEND_CONFIRMATION_PURPOSE_QUOTE,
  verifySendConfirmationToken,
} from '@/services/send-confirmation-token.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_SENT: 'ALREADY_SENT',
  INVALID_SEND_CONFIRMATION: 'INVALID_SEND_CONFIRMATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const list = async (req: Request, res: Response) => {
  const queryParsed = parseQuoteListQuery(req.query);
  if (!queryParsed.success) {
    replyInvalidDocumentListQuery(res, queryParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  const { estado, client_id, desde, hasta } = queryParsed.data;

  try {
    const quotes = await quoteService.list(req.user!.id, {
      estado,
      client_id,
      desde,
      hasta,
    });
    return res.status(200).json({ success: true, data: quotes });
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const create = async (req: Request, res: Response) => {
  const parsed = createQuoteSchema.safeParse(req.body);

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
    const quote = await quoteService.create(req.user!.id, parsed.data);
    return res.status(201).json({ success: true, data: quote });
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

  const parsed = updateQuoteSchema.safeParse(req.body);

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
    const quote = await quoteService.update(req.user!.id, paramsParsed.data.id, parsed.data);
    return res.status(200).json({ success: true, data: quote });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === quoteService.QUOTE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Presupuesto no encontrado', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === quoteService.QUOTE_ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'El presupuesto ya fue enviado y no puede modificarse', code: ERROR_CODES.ALREADY_SENT },
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
    await quoteService.remove(req.user!.id, paramsParsed.data.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === quoteService.QUOTE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Presupuesto no encontrado', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === quoteService.QUOTE_ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'El presupuesto ya fue enviado y no puede eliminarse', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const convert = async (req: Request, res: Response) => {
  const paramsParsed = safeParseUuidParams(req.params);
  if (!paramsParsed.success) {
    replyInvalidUuidParams(res, paramsParsed.error, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  const parsed = convertQuoteSchema.safeParse(req.body ?? {});

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
    const invoice = await quoteService.convertToInvoice(
      req.user!.id,
      paramsParsed.data.id,
      parsed.data.fecha_emision,
    );
    return res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    if (error instanceof Error && error.message === quoteService.QUOTE_NOT_FOUND) {
      return res.status(404).json({
        success: false,
        error: { message: 'Presupuesto no encontrado', code: ERROR_CODES.NOT_FOUND },
      });
    }

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
    await quoteService.assertQuoteCanRequestSendConfirmation(userId, id);
    const confirmationToken = issueSendConfirmationToken(SEND_CONFIRMATION_PURPOSE_QUOTE, userId, id);
    return res.status(200).json({ success: true, data: { confirmationToken } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === quoteService.QUOTE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Presupuesto no encontrado', code: ERROR_CODES.NOT_FOUND },
        });
      }
      if (error.message === quoteService.QUOTE_ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'El presupuesto ya fue enviado', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }
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
      SEND_CONFIRMATION_PURPOSE_QUOTE,
      userId,
      id,
    );
    const quote = await quoteService.send(userId, id);
    return res.status(200).json({ success: true, data: quote });
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_SEND_CONFIRMATION) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Token de confirmación inválido o caducado. Solicita uno nuevo desde la app.',
          code: ERROR_CODES.INVALID_SEND_CONFIRMATION,
        },
      });
    }

    if (error instanceof Error) {
      if (error.message === quoteService.QUOTE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Presupuesto no encontrado', code: ERROR_CODES.NOT_FOUND },
        });
      }

      if (error.message === quoteService.QUOTE_ALREADY_SENT) {
        return res.status(409).json({
          success: false,
          error: { message: 'El presupuesto ya fue enviado', code: ERROR_CODES.ALREADY_SENT },
        });
      }
    }

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
    const quote = await quoteService.resendQuoteEmail(req.user!.id, paramsParsed.data.id);
    return res.status(200).json({ success: true, data: quote });
  } catch (error) {
    if (error instanceof Error && error.message === quoteService.QUOTE_NOT_FOUND) {
      return res.status(404).json({
        success: false,
        error: { message: 'Presupuesto no encontrado', code: ERROR_CODES.NOT_FOUND },
      });
    }
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
    const quote = await quoteService.copyQuote(req.user!.id, paramsParsed.data.id);
    return res.status(201).json({ success: true, data: quote });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === quoteService.QUOTE_NOT_FOUND) {
        return res.status(404).json({
          success: false,
          error: { message: 'Presupuesto no encontrado', code: ERROR_CODES.NOT_FOUND },
        });
      }
    }
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
