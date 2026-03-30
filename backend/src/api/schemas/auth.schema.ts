import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('El email no es válido'),
  password: z.string()
    .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
    .max(PASSWORD_MAX_LENGTH, `La contraseña debe tener máximo ${PASSWORD_MAX_LENGTH} caracteres`)
    .regex(
      PASSWORD_COMPLEXITY_REGEX,
      'La contraseña debe incluir al menos una minúscula, una mayúscula y un número',
    ),
  nombre_comercial: z.string().trim().min(1, 'El nombre comercial es requerido'),
  nif: z.string().trim().min(1, 'El NIF es requerido'),
  direccion_fiscal: z.string().trim().min(1, 'La dirección fiscal es requerida'),
  telefono: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('El email no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const updateProfileSchema = z.object({
  email: z.string().trim().toLowerCase().email('El email no es válido'),
  nombre_comercial: z.string().trim().min(1, 'El nombre comercial es requerido'),
  nif: z.string().trim().min(1, 'El NIF es requerido'),
  direccion_fiscal: z.string().trim().min(1, 'La dirección fiscal es requerida'),
  telefono: z.string().trim().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
