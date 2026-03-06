import { prisma } from '../config/database';
import type { CreateQuoteInput, DocumentLineInput } from '../api/schemas/document.schema';

export const QUOTE_NOT_FOUND = 'QUOTE_NOT_FOUND';

export interface QuoteFilters {
  estado?: 'borrador' | 'enviado';
  client_id?: string;
  desde?: string;
  hasta?: string;
}

export const list = async (userId: string, filters: QuoteFilters = {}) => {
  return prisma.quote.findMany({
    where: {
      user_id: userId,
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.client_id && { client_id: filters.client_id }),
      ...(filters.desde || filters.hasta
        ? {
            fecha: {
              ...(filters.desde && { gte: new Date(filters.desde) }),
              ...(filters.hasta && { lte: new Date(filters.hasta + 'T23:59:59.999Z') }),
            },
          }
        : {}),
    },
    include: { lines: true },
    orderBy: { created_at: 'desc' },
  });
};

const roundTwo = (n: number) => Math.round(n * 100) / 100;

const calculateLineTotals = (line: DocumentLineInput) => {
  const subtotal = roundTwo(line.cantidad * line.precio_unitario);
  return { subtotal };
};

const calculateDocumentTotals = (lines: DocumentLineInput[]) => {
  let subtotal = 0;
  let total_iva = 0;

  for (const line of lines) {
    const lineSubtotal = roundTwo(line.cantidad * line.precio_unitario);
    const lineIva = roundTwo(lineSubtotal * (line.iva_porcentaje / 100));
    subtotal += lineSubtotal;
    total_iva += lineIva;
  }

  return {
    subtotal: roundTwo(subtotal),
    total_iva: roundTwo(total_iva),
    total: roundTwo(subtotal + total_iva),
  };
};

export const create = async (userId: string, data: CreateQuoteInput) => {
  const totals = calculateDocumentTotals(data.lines);

  return prisma.quote.create({
    data: {
      user_id: userId,
      client_id: data.client_id,
      fecha: new Date(data.fecha),
      notas: data.notas,
      subtotal: totals.subtotal,
      total_iva: totals.total_iva,
      total: totals.total,
      lines: {
        create: data.lines.map((line) => {
          const { subtotal } = calculateLineTotals(line);
          return {
            service_id: line.service_id,
            descripcion: line.descripcion,
            cantidad: line.cantidad,
            precio_unitario: line.precio_unitario,
            iva_porcentaje: line.iva_porcentaje,
            subtotal,
          };
        }),
      },
    },
    include: { lines: true },
  });
};

export const send = async (userId: string, id: string) => {
  const result = await prisma.quote.updateMany({
    where: { id, user_id: userId },
    data: { estado: 'enviado' },
  });

  if (result.count === 0) {
    throw new Error(QUOTE_NOT_FOUND);
  }

  return prisma.quote.findFirst({ where: { id, user_id: userId }, include: { lines: true } });
};
