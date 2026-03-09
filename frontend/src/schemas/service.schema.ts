import { z } from 'zod';
import i18next from 'i18next';

export const createServiceSchema = () =>
  z.object({
    nombre: z.string().min(1, i18next.t('validation.nameRequired')),
    descripcion: z.string().optional(),
    precioBase: z.coerce.number().min(0, i18next.t('validation.negativePriceNotAllowed')),
  });

export type ServiceInput = z.infer<ReturnType<typeof createServiceSchema>>;
