import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('El email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener mínimo 8 caracteres'),
  nombre_comercial: z.string().min(1, 'El nombre comercial es requerido'),
  nif: z.string().min(1, 'El NIF es requerido'),
  direccion_fiscal: z.string().min(1, 'La dirección fiscal es requerida'),
  telefono: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
