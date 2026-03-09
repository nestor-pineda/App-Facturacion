import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { renderQuoteEmailHtml, type QuoteTemplateData } from '@/templates/email/quote-email.template';
import { renderInvoiceEmailHtml, type InvoiceTemplateData } from '@/templates/email/invoice-email.template';
import type { EmailLine } from '@/templates/email/shared';

export type { EmailLine };

export interface QuoteEmailData {
  client: { nombre: string; email: string };
  user: { nombre_comercial: string; nif: string };
  quote: {
    fecha: Date | string;
    notas?: string | null;
    subtotal: number | string;
    total_iva: number | string;
    total: number | string;
    lines: EmailLine[];
  };
}

export interface InvoiceEmailData {
  client: { nombre: string; email: string };
  user: { nombre_comercial: string; nif: string };
  invoice: {
    numero: string | null;
    fecha_emision: Date | string;
    notas?: string | null;
    subtotal: number | string;
    total_iva: number | string;
    total: number | string;
    lines: EmailLine[];
  };
}

const createTransport = () => {
  if (!env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  });
};

const toNumber = (v: number | string): number =>
  typeof v === 'string' ? parseFloat(v) : v;

const normalizeLines = (lines: EmailLine[]): EmailLine[] =>
  lines.map((l) => ({
    descripcion: l.descripcion,
    cantidad: toNumber(l.cantidad),
    precio_unitario: toNumber(l.precio_unitario),
    iva_porcentaje: toNumber(l.iva_porcentaje),
    subtotal: toNumber(l.subtotal),
  }));

export const sendQuoteEmail = async (data: QuoteEmailData): Promise<void> => {
  const transport = createTransport();
  if (!transport) return;

  const templateData: QuoteTemplateData = {
    client: data.client,
    user: data.user,
    quote: {
      fecha: data.quote.fecha,
      notas: data.quote.notas,
      subtotal: toNumber(data.quote.subtotal),
      total_iva: toNumber(data.quote.total_iva),
      total: toNumber(data.quote.total),
      lines: normalizeLines(data.quote.lines),
    },
  };

  const html = renderQuoteEmailHtml(templateData);

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: data.client.email,
    subject: `Presupuesto de ${data.user.nombre_comercial}`,
    html,
  });
};

export const sendInvoiceEmail = async (data: InvoiceEmailData): Promise<void> => {
  const transport = createTransport();
  if (!transport) return;

  const templateData: InvoiceTemplateData = {
    client: data.client,
    user: data.user,
    invoice: {
      numero: data.invoice.numero,
      fecha_emision: data.invoice.fecha_emision,
      notas: data.invoice.notas,
      subtotal: toNumber(data.invoice.subtotal),
      total_iva: toNumber(data.invoice.total_iva),
      total: toNumber(data.invoice.total),
      lines: normalizeLines(data.invoice.lines),
    },
  };

  const html = renderInvoiceEmailHtml(templateData);

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: data.client.email,
    subject: `Factura ${data.invoice.numero ?? ''} de ${data.user.nombre_comercial}`,
    html,
  });
};
