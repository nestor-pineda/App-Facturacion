import type { Service } from '@prisma/client';
import { z } from 'genkit';
import { ai } from '@/agent/genkit.config';
import * as serviceService from '@/services/service.service';

const ServiceToolRowSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  precioBase: z.number(),
  ivaPorcentaje: z.number(),
});

export function createServiceTools(userId: string) {
  const searchServicesTool = ai.defineTool(
    {
      name: 'searchServices',
      description: `Busca servicios del catálogo por nombre (búsqueda parcial).
        Usar cuando el usuario menciona un servicio y necesitas precio e ID.`,
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe('Nombre parcial del servicio a buscar'),
      }),
      outputSchema: z.array(ServiceToolRowSchema),
    },
    async (input) => {
      const services = await serviceService.search(userId, input.query);
      return services.map((s: Service) => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion,
        precioBase: Number(s.precio_base),
        ivaPorcentaje: Number(s.iva_porcentaje),
      }));
    }
  );

  const listServicesTool = ai.defineTool(
    {
      name: 'listServices',
      description:
        'Lista todos los servicios del catálogo del usuario autenticado.',
      inputSchema: z.object({}),
      outputSchema: z.array(ServiceToolRowSchema),
    },
    async () => {
      const services = await serviceService.list(userId);
      return services.map((s: Service) => ({
        id: s.id,
        nombre: s.nombre,
        descripcion: s.descripcion,
        precioBase: Number(s.precio_base),
        ivaPorcentaje: Number(s.iva_porcentaje),
      }));
    }
  );

  return { searchServicesTool, listServicesTool };
}
