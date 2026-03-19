import { z } from 'zod';
import i18next from 'i18next';
import { IVA_DEFAULT } from '@/lib/constants';

export const createInvoiceLineSchema = () =>
  z.object({
    serviceId: z.string().uuid().nullable().default(null),
    descripcion: z.string().min(1, i18next.t('validation.descriptionRequired')),
    cantidad: z.coerce.number().int(i18next.t('validation.quantityInteger')).min(1, i18next.t('validation.quantityMin')),
    precioUnitario: z.coerce.number().min(0, i18next.t('validation.negativePriceNotAllowed')),
    ivaPorcentaje: z.coerce.number().default(IVA_DEFAULT),
  });

export const createInvoiceSchema = () =>
  z.object({
    clientId: z.string().uuid(i18next.t('validation.clientInvalid')),
    fechaEmision: z.string().min(1, i18next.t('validation.dateRequired')),
    notas: z.string().optional(),
    lines: z.array(createInvoiceLineSchema()).min(1, i18next.t('validation.minOneLine')),
  });

export type InvoiceLineInput = z.infer<ReturnType<typeof createInvoiceLineSchema>>;
export type CreateInvoiceInput = z.infer<ReturnType<typeof createInvoiceSchema>>;
