import { z } from 'zod';

export const createClientSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  email: z.string().trim().toLowerCase().email('El email no es válido'),
  cif_nif: z.string().trim().min(1, 'El CIF/NIF es requerido'),
  direccion: z.string().trim().min(1, 'La dirección es requerida'),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
