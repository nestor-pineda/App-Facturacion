import { z } from 'zod';
import i18next from 'i18next';

export const createClientSchema = () =>
  z.object({
    nombre: z.string().min(1, i18next.t('validation.nameRequired')),
    email: z.string().email(i18next.t('validation.emailInvalid')),
    cifNif: z.string().min(1, i18next.t('validation.cifNifRequired')),
    direccion: z.string().min(1, i18next.t('validation.addressRequired')),
    telefono: z.string().optional(),
  });

export type ClientInput = z.infer<ReturnType<typeof createClientSchema>>;
