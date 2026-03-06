import { prisma } from '../config/database';
import type { CreateQuoteInput, DocumentLineInput, UpdateQuoteInput } from '../api/schemas/document.schema';
import { sendQuoteEmail } from './email.service';

export const QUOTE_NOT_FOUND = 'QUOTE_NOT_FOUND';
export const QUOTE_ALREADY_SENT = 'QUOTE_ALREADY_SENT';

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

export const update = async (userId: string, id: string, data: UpdateQuoteInput) => {
  const totals = calculateDocumentTotals(data.lines);

  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({ where: { id, user_id: userId } });

    if (!quote) {
      throw new Error(QUOTE_NOT_FOUND);
    }

    if (quote.estado !== 'borrador') {
      throw new Error(QUOTE_ALREADY_SENT);
    }

    await tx.quoteLine.deleteMany({ where: { quote_id: id } });
    return tx.quote.update({
      where: { id },
      data: {
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
  });
};

export const remove = async (userId: string, id: string) => {
  const quote = await prisma.quote.findFirst({ where: { id, user_id: userId } });

  if (!quote) {
    throw new Error(QUOTE_NOT_FOUND);
  }

  if (quote.estado !== 'borrador') {
    throw new Error(QUOTE_ALREADY_SENT);
  }

  await prisma.quote.delete({ where: { id } });
};

export const convertToInvoice = async (userId: string, quoteId: string, fechaEmision?: string) => {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, user_id: userId },
    include: { lines: true },
  });

  if (!quote) {
    throw new Error(QUOTE_NOT_FOUND);
  }

  return prisma.invoice.create({
    data: {
      user_id: userId,
      client_id: quote.client_id,
      fecha_emision: fechaEmision ? new Date(fechaEmision) : new Date(),
      notas: quote.notas,
      subtotal: quote.subtotal,
      total_iva: quote.total_iva,
      total: quote.total,
      lines: {
        create: quote.lines.map((line) => ({
          service_id: line.service_id,
          descripcion: line.descripcion,
          cantidad: line.cantidad,
          precio_unitario: line.precio_unitario,
          iva_porcentaje: line.iva_porcentaje,
          subtotal: line.subtotal,
        })),
      },
    },
    include: { lines: true },
  });
};

export const send = async (userId: string, id: string) => {
  const quote = await prisma.quote.findFirst({
    where: { id, user_id: userId },
    include: { client: true, user: true },
  });

  if (!quote) {
    throw new Error(QUOTE_NOT_FOUND);
  }

  if (quote.estado === 'enviado') {
    throw new Error(QUOTE_ALREADY_SENT);
  }

  const sent = await prisma.quote.update({
    where: { id },
    data: { estado: 'enviado' },
    include: { lines: true },
  });

  try {
    await sendQuoteEmail({
      client: { nombre: quote.client.nombre, email: quote.client.email },
      user: { nombre_comercial: quote.user.nombre_comercial ?? '', nif: quote.user.nif ?? '' },
      quote: {
        fecha: sent.fecha,
        notas: sent.notas,
        subtotal: Number(sent.subtotal),
        total_iva: Number(sent.total_iva),
        total: Number(sent.total),
        lines: sent.lines.map((l) => ({
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario),
          iva_porcentaje: Number(l.iva_porcentaje),
          subtotal: Number(l.subtotal),
        })),
      },
    });
  } catch (err) {
    console.error('[email] Failed to send quote email:', err);
  }

  return sent;
};
