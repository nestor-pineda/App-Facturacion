import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombreComercial: z.string().min(1, 'Nombre comercial obligatorio'),
  nif: z.string().min(1, 'NIF obligatorio'),
  direccionFiscal: z.string().min(1, 'Dirección fiscal obligatoria'),
  telefono: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
