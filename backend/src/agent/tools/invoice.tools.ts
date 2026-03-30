import type { CreateInvoiceInput } from '@/api/schemas/document.schema';
import { ai } from '@/agent/genkit.config';
import * as invoiceService from '@/services/invoice.service';
import { z } from 'genkit';

const InvoiceLineToolInputSchema = z.object({
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

const ListInvoiceItemSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['borrador', 'enviada']),
  clientId: z.string().uuid(),
  fechaEmision: z.string(),
  total: z.number(),
  numero: z.string().nullable(),
});

const InvoiceLineDetailSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid().nullable(),
  descripcion: z.string(),
  cantidad: z.number(),
  precioUnitario: z.number(),
  ivaPorcentaje: z.number(),
  subtotal: z.number(),
});

const InvoiceDetailSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['borrador', 'enviada']),
  clientId: z.string().uuid(),
  fechaEmision: z.string(),
  notas: z.string().nullable(),
  subtotal: z.number(),
  totalIva: z.number(),
  total: z.number(),
  numero: z.string().nullable(),
  client: z.object({
    id: z.string().uuid(),
    nombre: z.string(),
    email: z.string(),
  }),
  lines: z.array(InvoiceLineDetailSchema),
});

type InvoiceListRow = Awaited<ReturnType<typeof invoiceService.list>>[number];
type InvoiceDetail = Awaited<ReturnType<typeof invoiceService.getById>>;
type InvoiceLineRow = InvoiceDetail['lines'][number];

function mapLinesToCreateInput(
  lines: z.infer<typeof InvoiceLineToolInputSchema>[]
): CreateInvoiceInput['lines'] {
  return lines.map(line => ({
    ...(line.serviceId != null ? { service_id: line.serviceId } : {}),
    descripcion: line.descripcion,
    cantidad: line.cantidad,
    precio_unitario: line.precioUnitario,
    iva_porcentaje: line.ivaPorcentaje,
  }));
}

export function createInvoiceTools(userId: string) {
  const listInvoicesTool = ai.defineTool(
    {
      name: 'listInvoices',
      description:
        'Lista facturas del usuario con filtros opcionales por estado (borrador/enviada) y por cliente.',
      inputSchema: z.object({
        estado: z.enum(['borrador', 'enviada']).optional(),
        clientId: z.string().uuid().optional(),
      }),
      outputSchema: z.array(ListInvoiceItemSchema),
    },
    async input => {
      const filters: invoiceService.InvoiceFilters = {};
      if (input.estado) filters.estado = input.estado;
      if (input.clientId) filters.client_id = input.clientId;

      const rows = await invoiceService.list(userId, filters);
      return rows.map((inv: InvoiceListRow) => ({
        id: inv.id,
        estado: inv.estado,
        clientId: inv.client_id,
        fechaEmision: inv.fecha_emision.toISOString().slice(0, 10),
        total: Number(inv.total),
        numero: inv.numero,
      }));
    }
  );

  const getInvoiceTool = ai.defineTool(
    {
      name: 'getInvoice',
      description:
        'Obtiene el detalle completo de una factura por su UUID, incluidas líneas y datos del cliente.',
      inputSchema: z.object({
        invoiceId: z.string().uuid().describe('UUID de la factura'),
      }),
      outputSchema: InvoiceDetailSchema,
    },
    async input => {
      const inv = await invoiceService.getById(userId, input.invoiceId);
      return {
        id: inv.id,
        estado: inv.estado,
        clientId: inv.client_id,
        fechaEmision: inv.fecha_emision.toISOString().slice(0, 10),
        notas: inv.notas,
        subtotal: Number(inv.subtotal),
        totalIva: Number(inv.total_iva),
        total: Number(inv.total),
        numero: inv.numero,
        client: {
          id: inv.client.id,
          nombre: inv.client.nombre,
          email: inv.client.email,
        },
        lines: inv.lines.map((l: InvoiceLineRow) => ({
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

  const createInvoiceTool = ai.defineTool(
    {
      name: 'createInvoice',
      description: `Crea una factura en estado borrador con al menos una línea.
        El número legal se asigna solo al enviar. Usa searchClients antes si no tienes el clientId.`,
      inputSchema: z.object({
        clientId: z.string().uuid().describe('UUID del cliente'),
        fechaEmision: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('Fecha de emisión YYYY-MM-DD'),
        notas: z.string().optional().describe('Notas opcionales'),
        lines: z.array(InvoiceLineToolInputSchema).min(1),
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
      const data: CreateInvoiceInput = {
        client_id: input.clientId,
        fecha_emision: input.fechaEmision,
        notas: input.notas,
        lines: mapLinesToCreateInput(input.lines),
      };
      const inv = await invoiceService.create(userId, data);
      return {
        id: inv.id,
        estado: 'borrador' as const,
        subtotal: Number(inv.subtotal),
        totalIva: Number(inv.total_iva),
        total: Number(inv.total),
        message: `Factura borrador creada. Total: ${inv.total}€`,
      };
    }
  );

  return {
    listInvoicesTool,
    getInvoiceTool,
    createInvoiceTool,
  };
}
