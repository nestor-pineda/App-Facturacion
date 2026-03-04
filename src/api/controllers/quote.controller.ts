import { Request, Response } from 'express';
import { createQuoteSchema } from '../schemas/document.schema';
import * as quoteService from '../../services/quote.service';

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

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
  } catch {
    return res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

export const send = async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.send(req.user!.id, req.params.id);
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
