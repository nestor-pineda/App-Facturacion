import { z } from 'zod';

export const createServiceSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  descripcion: z.string().trim().optional(),
  precio_base: z.number().positive('El precio base debe ser positivo'),
  iva_porcentaje: z.number().min(0).max(100).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
