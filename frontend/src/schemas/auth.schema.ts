import { z } from 'zod';
import i18next from 'i18next';

export const REGISTER_PASSWORD_MIN_LENGTH = 12;
export const REGISTER_PASSWORD_MAX_LENGTH = 128;
export const REGISTER_PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const createLoginSchema = () =>
  z.object({
    email: z.string().email(i18next.t('validation.emailInvalid')),
    password: z.string().min(6, i18next.t('validation.minPassword')),
  });

export const createRegisterSchema = () =>
  z.object({
    email: z.string().email(i18next.t('validation.emailInvalid')),
    password: z
      .string()
      .min(
        REGISTER_PASSWORD_MIN_LENGTH,
        i18next.t('validation.registerPasswordMin', { count: REGISTER_PASSWORD_MIN_LENGTH }),
      )
      .max(
        REGISTER_PASSWORD_MAX_LENGTH,
        i18next.t('validation.registerPasswordMax', { count: REGISTER_PASSWORD_MAX_LENGTH }),
      )
      .regex(REGISTER_PASSWORD_COMPLEXITY_REGEX, i18next.t('validation.registerPasswordComplexity')),
    nombreComercial: z.string().min(1, i18next.t('validation.businessNameRequired')),
    nif: z.string().min(1, i18next.t('validation.nifRequired')),
    direccionFiscal: z.string().min(1, i18next.t('validation.fiscalAddressRequired')),
    telefono: z.string().optional(),
  });

export const createUpdateProfileSchema = () =>
  z.object({
    email: z.string().email(i18next.t('validation.emailInvalid')),
    nombreComercial: z.string().min(1, i18next.t('validation.businessNameRequired')),
    nif: z.string().min(1, i18next.t('validation.nifRequired')),
    direccionFiscal: z.string().min(1, i18next.t('validation.fiscalAddressRequired')),
    telefono: z.string().optional(),
  });

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
export type UpdateProfileInput = z.infer<ReturnType<typeof createUpdateProfileSchema>>;
