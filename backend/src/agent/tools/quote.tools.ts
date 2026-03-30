import type { CreateQuoteInput } from '@/api/schemas/document.schema';
import { ai } from '@/agent/genkit.config';
import * as quoteService from '@/services/quote.service';
import { z } from 'genkit';

const QuoteLineToolInputSchema = z.object({
  serviceId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('UUID del servicio del catálogo; omitir o null para línea manual'),
  descripcion: z.string().min(1).describe('Descripción del concepto'),
  cantidad: z.number().positive().describe('Unidades o horas'),
  precioUnitario: z.number().positive().describe('Precio unitario sin IVA en euros'),
  ivaPorcentaje: z
    .number()
    .min(0)
    .max(100)
    .default(21)
    .describe('Porcentaje de IVA; en MVP suele ser 21'),
});

const ListQuoteItemSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['borrador', 'enviado']),
  clientId: z.string().uuid(),
  fecha: z.string(),
  total: z.number(),
});

const QuoteLineDetailSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid().nullable(),
  descripcion: z.string(),
  cantidad: z.number(),
  precioUnitario: z.number(),
  ivaPorcentaje: z.number(),
  subtotal: z.number(),
});

const QuoteDetailSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['borrador', 'enviado']),
  clientId: z.string().uuid(),
  fecha: z.string(),
  notas: z.string().nullable(),
  subtotal: z.number(),
  totalIva: z.number(),
  total: z.number(),
  client: z.object({
    id: z.string().uuid(),
    nombre: z.string(),
    email: z.string(),
  }),
  lines: z.array(QuoteLineDetailSchema),
});

type QuoteListRow = Awaited<ReturnType<typeof quoteService.list>>[number];
type QuoteDetail = Awaited<ReturnType<typeof quoteService.getById>>;
type QuoteLineRow = QuoteDetail['lines'][number];

function mapLinesToCreateInput(
  lines: z.infer<typeof QuoteLineToolInputSchema>[]
): CreateQuoteInput['lines'] {
  return lines.map(line => ({
    ...(line.serviceId != null ? { service_id: line.serviceId } : {}),
    descripcion: line.descripcion,
    cantidad: line.cantidad,
    precio_unitario: line.precioUnitario,
    iva_porcentaje: line.ivaPorcentaje,
  }));
}

export function createQuoteTools(userId: string) {
  const listQuotesTool = ai.defineTool(
    {
      name: 'listQuotes',
      description:
        'Lista presupuestos del usuario con filtros opcionales por estado (borrador/enviado) y por cliente.',
      inputSchema: z.object({
        estado: z.enum(['borrador', 'enviado']).optional(),
        clientId: z.string().uuid().optional(),
      }),
      outputSchema: z.array(ListQuoteItemSchema),
    },
    async input => {
      const filters: quoteService.QuoteFilters = {};
      if (input.estado) filters.estado = input.estado;
      if (input.clientId) filters.client_id = input.clientId;

      const rows = await quoteService.list(userId, filters);
      return rows.map((q: QuoteListRow) => ({
        id: q.id,
        estado: q.estado,
        clientId: q.client_id,
        fecha: q.fecha.toISOString().slice(0, 10),
        total: Number(q.total),
      }));
    }
  );

  const getQuoteTool = ai.defineTool(
    {
      name: 'getQuote',
      description:
        'Obtiene el detalle completo de un presupuesto por su UUID, incluidas líneas y cliente.',
      inputSchema: z.object({
        quoteId: z.string().uuid().describe('UUID del presupuesto'),
      }),
      outputSchema: QuoteDetailSchema,
    },
    async input => {
      const q = await quoteService.getById(userId, input.quoteId);
      return {
        id: q.id,
        estado: q.estado,
        clientId: q.client_id,
        fecha: q.fecha.toISOString().slice(0, 10),
        notas: q.notas,
        subtotal: Number(q.subtotal),
        totalIva: Number(q.total_iva),
        total: Number(q.total),
        client: {
          id: q.client.id,
          nombre: q.client.nombre,
          email: q.client.email,
        },
        lines: q.lines.map((l: QuoteLineRow) => ({
          id: l.id,
          serviceId: l.service_id,
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad),
          precioUnitario: Number(l.precio_unitario),
          ivaPorcentaje: Number(l.iva_porcentaje),
          subtotal: Number(l.subtotal),
        })),
      };
    }
  );

  const createQuoteTool = ai.defineTool(
    {
      name: 'createQuote',
      description: `Crea un presupuesto en borrador con al menos una línea.
        Usa searchClients antes si no tienes el clientId.`,
      inputSchema: z.object({
        clientId: z.string().uuid().describe('UUID del cliente'),
        fecha: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('Fecha del presupuesto YYYY-MM-DD'),
        notas: z.string().optional(),
        lines: z.array(QuoteLineToolInputSchema).min(1),
      }),
      outputSchema: z.object({
        id: z.string().uuid(),
        estado: z.literal('borrador'),
        subtotal: z.number(),
        totalIva: z.number(),
        total: z.number(),
        message: z.string(),
      }),
    },
    async input => {
      const data: CreateQuoteInput = {
        client_id: input.clientId,
        fecha: input.fecha,
        notas: input.notas,
        lines: mapLinesToCreateInput(input.lines),
      };
      const q = await quoteService.create(userId, data);
      return {
        id: q.id,
        estado: 'borrador' as const,
        subtotal: Number(q.subtotal),
        totalIva: Number(q.total_iva),
        total: Number(q.total),
        message: `Presupuesto borrador creado. Total: ${q.total}€`,
      };
    }
  );

  return {
    listQuotesTool,
    getQuoteTool,
    createQuoteTool,
  };
}
