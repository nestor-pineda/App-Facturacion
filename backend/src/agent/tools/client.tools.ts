import type { Client } from '@prisma/client';
import { z } from 'genkit';
import { ai } from '@/agent/genkit.config';
import * as clientService from '@/services/client.service';

const ClientToolRowSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  email: z.string(),
  cifNif: z.string(),
});

export function createClientTools(userId: string) {
  const searchClientsTool = ai.defineTool(
    {
      name: 'searchClients',
      description: `Busca clientes por nombre o email.
        Usar SIEMPRE antes de crear facturas o presupuestos
        para obtener el clientId real. Nunca inventar UUIDs.`,
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe('Nombre o email parcial del cliente a buscar'),
      }),
      outputSchema: z.array(ClientToolRowSchema),
    },
    async (input) => {
      const clients = await clientService.search(userId, input.query);
      return clients.map((c: Client) => ({
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        cifNif: c.cif_nif,
      }));
    }
  );

  const listClientsTool = ai.defineTool(
    {
      name: 'listClients',
      description:
        'Lista todos los clientes del usuario autenticado. Útil para consultas generales de cartera.',
      inputSchema: z.object({}),
      outputSchema: z.array(ClientToolRowSchema),
    },
    async () => {
      const { data } = await clientService.list(userId);
      return data.map((c: Client) => ({
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        cifNif: c.cif_nif,
      }));
    }
  );

  return { searchClientsTool, listClientsTool };
}
