import { prisma } from '../config/database';
import type { CreateInvoiceInput, DocumentLineInput, UpdateInvoiceInput } from '../api/schemas/document.schema';
import { generateInvoiceNumber } from './numbering.service';

export const INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND';
export const ALREADY_SENT = 'ALREADY_SENT';

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

export interface InvoiceFilters {
  estado?: 'borrador' | 'enviada';
  client_id?: string;
  desde?: string;
  hasta?: string;
}

export const list = async (userId: string, filters: InvoiceFilters = {}) => {
  return prisma.invoice.findMany({
    where: {
      user_id: userId,
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.client_id && { client_id: filters.client_id }),
      ...(filters.desde || filters.hasta
        ? {
            fecha_emision: {
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

export const create = async (userId: string, data: CreateInvoiceInput) => {
  const totals = calculateDocumentTotals(data.lines);

  return prisma.invoice.create({
    data: {
      user_id: userId,
      client_id: data.client_id,
      fecha_emision: new Date(data.fecha_emision),
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

export const update = async (userId: string, id: string, data: UpdateInvoiceInput) => {
  const totals = calculateDocumentTotals(data.lines);

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id, user_id: userId } });

    if (!invoice) {
      throw new Error(INVOICE_NOT_FOUND);
    }

    if (invoice.estado !== 'borrador') {
      throw new Error(ALREADY_SENT);
    }

    await tx.invoiceLine.deleteMany({ where: { invoice_id: id } });
    return tx.invoice.update({
      where: { id },
      data: {
        client_id: data.client_id,
        fecha_emision: new Date(data.fecha_emision),
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
  const invoice = await prisma.invoice.findFirst({ where: { id, user_id: userId } });

  if (!invoice) {
    throw new Error(INVOICE_NOT_FOUND);
  }

  if (invoice.estado !== 'borrador') {
    throw new Error(ALREADY_SENT);
  }

  await prisma.invoice.delete({ where: { id } });
};

export const send = async (userId: string, id: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, user_id: userId },
  });

  if (!invoice) {
    throw new Error(INVOICE_NOT_FOUND);
  }

  if (invoice.estado === 'enviada') {
    throw new Error(ALREADY_SENT);
  }

  const numero = await generateInvoiceNumber(userId);

  await prisma.invoice.updateMany({
    where: { id, user_id: userId },
    data: { estado: 'enviada', numero },
  });

  return prisma.invoice.findFirst({ where: { id, user_id: userId }, include: { lines: true } });
};
