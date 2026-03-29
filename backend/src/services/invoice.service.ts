import { prisma } from '@/config/database';
import type { CreateInvoiceInput, DocumentLineInput, UpdateInvoiceInput } from '@/api/schemas/document.schema';
import { generateInvoiceNumber } from '@/services/numbering.service';
import { sendInvoiceEmail } from '@/services/email.service';

export const INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND';
export const ALREADY_SENT = 'ALREADY_SENT';
export const INVOICE_DRAFT = 'INVOICE_DRAFT';

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

export const getById = async (userId: string, id: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, user_id: userId },
    include: { lines: true, client: true, user: true },
  });

  if (!invoice) {
    throw new Error(INVOICE_NOT_FOUND);
  }

  return invoice;
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
    include: { lines: true, client: true },
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

  return prisma.$transaction(async (tx: typeof prisma) => {
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
    include: { client: true, user: true },
  });

  if (!invoice) {
    throw new Error(INVOICE_NOT_FOUND);
  }

  if (invoice.estado === 'enviada') {
    throw new Error(ALREADY_SENT);
  }

  const numero = await generateInvoiceNumber(userId);

  const sent = await prisma.invoice.update({
    where: { id },
    data: { estado: 'enviada', numero },
    include: { lines: true },
  });

  try {
    await sendInvoiceEmail({
      client: { nombre: invoice.client.nombre, email: invoice.client.email },
      user: { nombre_comercial: invoice.user.nombre_comercial ?? '', nif: invoice.user.nif ?? '' },
      invoice: {
        numero: sent.numero,
        fecha_emision: sent.fecha_emision,
        notas: sent.notas,
        subtotal: Number(sent.subtotal),
        total_iva: Number(sent.total_iva),
        total: Number(sent.total),
        lines: sent.lines.map((l: (typeof sent.lines)[number]) => ({
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario),
          iva_porcentaje: Number(l.iva_porcentaje),
          subtotal: Number(l.subtotal),
        })),
      },
    });
  } catch (err) {
    console.error('[email] Failed to send invoice email:', err);
  }

  return sent;
};

/**
 * Re-sends the invoice email without changing its state.
 * Used for already-sent invoices to send the email again.
 */
export const resendInvoiceEmail = async (userId: string, id: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, user_id: userId },
    include: { client: true, user: true, lines: true },
  });

  if (!invoice) {
    throw new Error(INVOICE_NOT_FOUND);
  }

  try {
    await sendInvoiceEmail({
      client: { nombre: invoice.client.nombre, email: invoice.client.email },
      user: { nombre_comercial: invoice.user.nombre_comercial ?? '', nif: invoice.user.nif ?? '' },
      invoice: {
        numero: invoice.numero ?? undefined,
        fecha_emision: invoice.fecha_emision,
        notas: invoice.notas,
        subtotal: Number(invoice.subtotal),
        total_iva: Number(invoice.total_iva),
        total: Number(invoice.total),
        lines: invoice.lines.map((l: (typeof invoice.lines)[number]) => ({
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario),
          iva_porcentaje: Number(l.iva_porcentaje),
          subtotal: Number(l.subtotal),
        })),
      },
    });
  } catch (err) {
    console.error('[email] Failed to resend invoice email:', err);
    throw err;
  }

  return invoice;
};

/**
 * Creates a new invoice in borrador with the same content as an existing invoice
 * (borrador or enviada). Uses today's date as fecha_emision for the new draft.
 */
export const copyInvoice = async (userId: string, id: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, user_id: userId },
    include: { lines: true },
  });

  if (!invoice) {
    throw new Error(INVOICE_NOT_FOUND);
  }

  const today = new Date().toISOString().slice(0, 10);
  const data: CreateInvoiceInput = {
    client_id: invoice.client_id,
    fecha_emision: today,
    notas: invoice.notas ?? undefined,
    lines: invoice.lines.map((line: (typeof invoice.lines)[number]) => ({
      service_id: line.service_id ?? undefined,
      descripcion: line.descripcion,
      cantidad: Number(line.cantidad),
      precio_unitario: Number(line.precio_unitario),
      iva_porcentaje: Number(line.iva_porcentaje),
    })),
  };

  return create(userId, data);
};
