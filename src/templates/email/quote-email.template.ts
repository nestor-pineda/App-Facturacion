import {
  wrapHtml,
  renderLinesTable,
  renderTotals,
  formatDate,
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

export const renderQuoteEmailHtml = (data: QuoteTemplateData): string => {
  const { client, user, quote } = data;

  const body = `
    <div class="header">
      <h1>Presupuesto de ${escapeHtml(user.nombre_comercial)}</h1>
      <p>Fecha: ${formatDate(quote.fecha)}</p>
    </div>
    <div class="body">
      <p class="greeting">Estimado/a <strong>${escapeHtml(client.nombre)}</strong>,</p>
      <p>Adjunto encontrará los detalles del presupuesto que le hemos preparado:</p>
      ${renderLinesTable(quote.lines)}
      ${renderTotals(quote.subtotal, quote.total_iva, quote.total)}
      ${
        quote.notas
          ? `<div class="notes"><strong>Notas:</strong><br>${escapeHtml(quote.notas)}</div>`
          : ''
      }
      <p style="margin-top:24px;font-size:13px;color:#555;">
        Emitido por: <strong>${escapeHtml(user.nombre_comercial)}</strong> &mdash; NIF: ${escapeHtml(user.nif)}
      </p>
    </div>`;

  return wrapHtml(`Presupuesto de ${user.nombre_comercial}`, body);
};
