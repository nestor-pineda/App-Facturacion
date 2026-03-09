import { z } from 'zod';

export const serviceSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  descripcion: z.string().optional(),
  precioBase: z.coerce.number().min(0, 'El precio no puede ser negativo'),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
