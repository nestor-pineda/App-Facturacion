import {
  wrapHtml,
  renderLinesTable,
  renderTotals,
  formatDateDashDMY,
  escapeHtml,
  type EmailLine,
} from '@/templates/email/shared';

export interface QuoteTemplateData {
  client: { nombre: string; email: string };
  user: { nombre_comercial: string; nif: string };
  quote: {
    fecha: Date | string;
    notas?: string | null;
    subtotal: number;
    total_iva: number;
    total: number;
    lines: EmailLine[];
  };
}

const STATUS_ENVIADO_LABEL = 'Enviado';

export const renderQuoteEmailHtml = (data: QuoteTemplateData): string => {
  const { client, user, quote } = data;

  const body = `
    <table class="doc-header-table" role="presentation">
      <tr>
        <td class="doc-header-titles">
          <div class="doc-header">
            <h1>Presupuesto</h1>
            <p class="doc-subtitle">${escapeHtml(client.nombre)}</p>
          </div>
        </td>
        <td align="right" valign="top" style="padding-top:4px;">
          <span class="status-badge">${STATUS_ENVIADO_LABEL}</span>
        </td>
      </tr>
    </table>
    <table class="meta-grid" role="presentation">
      <tr>
        <td>
          <span class="meta-label">Fecha:</span>
          <span class="meta-value">${formatDateDashDMY(quote.fecha)}</span>
        </td>
        <td>
          <span class="meta-label">Cliente:</span>
          <span class="meta-value">${escapeHtml(client.nombre)}</span>
        </td>
      </tr>
    </table>
    <p class="intro">Estimado/a <strong>${escapeHtml(client.nombre)}</strong>,</p>
    <p class="intro-secondary">Adjunto encontrará los detalles del presupuesto que le hemos preparado:</p>
    ${renderLinesTable(quote.lines)}
    ${renderTotals(quote.subtotal, quote.total_iva, quote.total)}
    ${
      quote.notas
        ? `<div class="notes-box"><strong>Notas:</strong><br>${escapeHtml(quote.notas)}</div>`
        : ''
    }
    <p class="issuer-line">
      Emitido por: <strong>${escapeHtml(user.nombre_comercial)}</strong> &mdash; NIF: ${escapeHtml(user.nif)}
    </p>`;

  return wrapHtml(`Presupuesto de ${user.nombre_comercial}`, body);
};
