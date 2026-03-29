import {
  wrapHtml,
  renderLinesTable,
  renderTotals,
  formatDateDashDMY,
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

  const titleText = invoice.numero
    ? `Factura ${escapeHtml(invoice.numero)}`
    : 'Factura';

  const body = `
    <div class="doc-header">
      <h1>${titleText}</h1>
      <p class="doc-subtitle">${escapeHtml(client.nombre)}</p>
    </div>
    <table class="meta-grid" role="presentation">
      <tr>
        <td>
          <span class="meta-label">Fecha:</span>
          <span class="meta-value">${formatDateDashDMY(invoice.fecha_emision)}</span>
        </td>
        <td>
          <span class="meta-label">Cliente:</span>
          <span class="meta-value">${escapeHtml(client.nombre)}</span>
        </td>
      </tr>
    </table>
    <p class="intro">Estimado/a <strong>${escapeHtml(client.nombre)}</strong>,</p>
    <p class="intro-secondary">Le remitimos la siguiente factura por los servicios prestados:</p>
    ${renderLinesTable(invoice.lines)}
    ${renderTotals(invoice.subtotal, invoice.total_iva, invoice.total)}
    ${
      invoice.notas
        ? `<div class="notes-box"><strong>Notas:</strong><br>${escapeHtml(invoice.notas)}</div>`
        : ''
    }
    <p class="issuer-line">
      Emitido por: <strong>${escapeHtml(user.nombre_comercial)}</strong> &mdash; NIF: ${escapeHtml(user.nif)}
    </p>`;

  return wrapHtml(`Factura ${invoice.numero ?? ''} de ${user.nombre_comercial}`, body);
};
