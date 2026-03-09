import { z } from 'zod';

export const documentLineSchema = z.object({
  service_id: z.string().uuid().optional(),
  descripcion: z.string().trim().min(1, 'La descripción es requerida'),
  cantidad: z.number().positive('La cantidad debe ser positiva'),
  precio_unitario: z.number().positive('El precio unitario debe ser positivo'),
  iva_porcentaje: z.number().min(0).max(100),
});

export const createQuoteSchema = z.object({
  client_id: z.string().uuid('El client_id debe ser un UUID válido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  notas: z.string().trim().optional(),
  lines: z.array(documentLineSchema).min(1, 'El presupuesto debe tener al menos una línea'),
});

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid('El client_id debe ser un UUID válido'),
  fecha_emision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
  notas: z.string().trim().optional(),
  lines: z.array(documentLineSchema).min(1, 'La factura debe tener al menos una línea'),
});

export const updateQuoteSchema = createQuoteSchema;
export const updateInvoiceSchema = createInvoiceSchema;

export const convertQuoteSchema = z.object({
  fecha_emision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD').optional(),
});

export type DocumentLineInput = z.infer<typeof documentLineSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateQuoteInput = CreateQuoteInput;
export type UpdateInvoiceInput = CreateInvoiceInput;
export type ConvertQuoteInput = z.infer<typeof convertQuoteSchema>;
