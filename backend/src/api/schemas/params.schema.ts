import type { ParamsDictionary } from 'express-serve-static-core';
import type { Request, Response } from 'express';
import { z } from 'zod';

/** Fechas de filtro en query (mismo patrón que documentos). */
export const QUERY_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const queryDateString = z
  .string()
  .regex(QUERY_DATE_REGEX, 'La fecha debe tener formato YYYY-MM-DD');

export const firstQueryString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0] !== '') {
    return value[0];
  }
  return undefined;
};

const listQueryShape = {
  client_id: z.string().uuid('El client_id debe ser un UUID válido').optional(),
  desde: queryDateString.optional(),
  hasta: queryDateString.optional(),
};

export const invoiceListQuerySchema = z.object({
  ...listQueryShape,
  estado: z.enum(['borrador', 'enviada']).optional(),
});

export const quoteListQuerySchema = z.object({
  ...listQueryShape,
  estado: z.enum(['borrador', 'enviado']).optional(),
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;
export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>;

export const parseInvoiceListQuery = (query: Request['query']) =>
  invoiceListQuerySchema.safeParse({
    estado: firstQueryString(query.estado),
    client_id: firstQueryString(query.client_id),
    desde: firstQueryString(query.desde),
    hasta: firstQueryString(query.hasta),
  });

export const parseQuoteListQuery = (query: Request['query']) =>
  quoteListQuerySchema.safeParse({
    estado: firstQueryString(query.estado),
    client_id: firstQueryString(query.client_id),
    desde: firstQueryString(query.desde),
    hasta: firstQueryString(query.hasta),
  });

export const uuidParamsSchema = z.object({
  id: z.string().uuid('El id debe ser un UUID válido'),
});

export type UuidParams = z.infer<typeof uuidParamsSchema>;

export const safeParseUuidParams = (params: ParamsDictionary) =>
  uuidParamsSchema.safeParse({ id: params.id ?? '' });

export const replyInvalidUuidParams = (res: Response, err: z.ZodError, code: string): void => {
  res.status(400).json({
    success: false,
    error: {
      message: 'Parámetros de ruta inválidos',
      code,
      details: err.flatten(),
    },
  });
};

export const replyInvalidDocumentListQuery = (res: Response, err: z.ZodError, code: string): void => {
  res.status(400).json({
    success: false,
    error: {
      message: 'Parámetros de consulta inválidos',
      code,
      details: err.flatten(),
    },
  });
};
