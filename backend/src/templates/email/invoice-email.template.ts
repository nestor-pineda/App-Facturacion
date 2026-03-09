import {
  wrapHtml,
  renderLinesTable,
  renderTotals,
  formatDate,
  escapeHtml,
  type EmailLine,
} from '@/templates/email/shared';

export interface InvoiceTemplateData {
  client: { nombre: string; email: string };
  user: { nombre_comercial: string; nif: string };
  invoice: {
    numero: string | null;
    fecha_emision: Date | string;
    notas?: string | null;
    subtotal: number;
    total_iva: number;
    total: number;
    lines: EmailLine[];
  };
}

export const renderInvoiceEmailHtml = (data: InvoiceTemplateData): string => {
  const { client, user, invoice } = data;

  const body = `
    <div class="header">
      <h1>Factura ${invoice.numero ? escapeHtml(invoice.numero) : ''}</h1>
      <p>${escapeHtml(user.nombre_comercial)} &mdash; Fecha: ${formatDate(invoice.fecha_emision)}</p>
    </div>
    <div class="body">
      <p class="greeting">Estimado/a <strong>${escapeHtml(client.nombre)}</strong>,</p>
      <p>Le remitimos la siguiente factura por los servicios prestados:</p>
      ${renderLinesTable(invoice.lines)}
      ${renderTotals(invoice.subtotal, invoice.total_iva, invoice.total)}
      ${
        invoice.notas
          ? `<div class="notes"><strong>Notas:</strong><br>${escapeHtml(invoice.notas)}</div>`
          : ''
      }
      <p style="margin-top:24px;font-size:13px;color:#555;">
        Emitido por: <strong>${escapeHtml(user.nombre_comercial)}</strong> &mdash; NIF: ${escapeHtml(user.nif)}
      </p>
    </div>`;

  return wrapHtml(`Factura ${invoice.numero ?? ''} de ${user.nombre_comercial}`, body);
};
