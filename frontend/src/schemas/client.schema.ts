import { z } from 'zod';

export const clientSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  email: z.string().email('Email inválido'),
  cifNif: z.string().min(1, 'CIF/NIF obligatorio'),
  direccion: z.string().min(1, 'Dirección obligatoria'),
  telefono: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
