import { z } from 'zod';
import { IVA_DEFAULT } from '@/lib/constants';

export const invoiceLineSchema = z.object({
  serviceId: z.string().uuid().nullable().default(null),
  descripcion: z.string().min(1, 'Descripción obligatoria'),
  cantidad: z.coerce.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  ivaPorcentaje: z.coerce.number().default(IVA_DEFAULT),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  fechaEmision: z.string().min(1, 'Fecha obligatoria'),
  notas: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'Debe agregar al menos una línea'),
});

export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
