import { z } from 'zod';
import { IVA_DEFAULT } from '@/lib/constants';

export const quoteLineSchema = z.object({
  serviceId: z.string().uuid().nullable().default(null),
  descripcion: z.string().min(1, 'Descripción obligatoria'),
  cantidad: z.coerce.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  ivaPorcentaje: z.coerce.number().default(IVA_DEFAULT),
});

export const createQuoteSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  fecha: z.string().min(1, 'Fecha obligatoria'),
  notas: z.string().optional(),
  lines: z.array(quoteLineSchema).min(1, 'Debe agregar al menos una línea'),
});

export type QuoteLineInput = z.infer<typeof quoteLineSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
