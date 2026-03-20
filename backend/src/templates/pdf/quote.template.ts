import type { QuoteTemplateData } from '@/types/pdf.types';
import { documentStyles } from '@/templates/pdf/styles/document.styles';
import { formatCurrency, formatDate, escapeHtml } from '@/templates/pdf/utils/formatters';

/**
 * Renders a complete HTML document for a quote (presupuesto) PDF.
 * All user-provided text fields are HTML-escaped to prevent injection.
 * The quote number is optional — when absent, only the title is shown.
 *
 * @param data - Typed quote data to render into the template
 * @returns Full HTML string ready to be passed to Puppeteer
 */
export const renderQuoteTemplate = (data: QuoteTemplateData): string => {
  const linesHtml = data.lineas
    .map(
      (line) => `
      <tr>
        <td>${escapeHtml(line.descripcion)}</td>
        <td class="text-center">${line.cantidad}</td>
        <td class="text-right">${formatCurrency(line.precioUnitario)}</td>
        <td class="text-right">${line.ivaPorcentaje}%</td>
        <td class="text-right">${formatCurrency(line.subtotal)}</td>
      </tr>`,
    )
    .join('');

  const notesHtml = data.notas
    ? `
    <div class="notes">
      <h4>Notas:</h4>
      <p>${escapeHtml(data.notas)}</p>
    </div>`
    : '';

  const emitterPhoneHtml = data.emisor.telefono
    ? `<div class="meta-row"><span class="meta-label">Tel:</span><span class="meta-value">${escapeHtml(data.emisor.telefono)}</span></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>${documentStyles}</style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="document-title">
        <h1>PRESUPUESTO</h1>
        <p class="document-subtitle">${escapeHtml(data.cliente.nombre)}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-row">
        <span class="meta-label">Fecha:</span>
        <span class="meta-value">${formatDate(data.fecha)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Emisor:</span>
        <span class="meta-value">${escapeHtml(data.emisor.nombre)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">NIF emisor:</span>
        <span class="meta-value">${escapeHtml(data.emisor.nif)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Dirección emisor:</span>
        <span class="meta-value">${escapeHtml(data.emisor.direccion)}</span>
      </div>
      ${emitterPhoneHtml}
      <div class="meta-row">
        <span class="meta-label">Cliente:</span>
        <span class="meta-value">${escapeHtml(data.cliente.nombre)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">NIF cliente:</span>
        <span class="meta-value">${escapeHtml(data.cliente.nif)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Dirección cliente:</span>
        <span class="meta-value">${escapeHtml(data.cliente.direccion)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Email cliente:</span>
        <span class="meta-value">${escapeHtml(data.cliente.email)}</span>
      </div>
      ${data.numero ? `<div class="meta-row"><span class="meta-label">Número:</span><span class="meta-value">${escapeHtml(data.numero)}</span></div>` : ''}
    </div>

    ${notesHtml}

    <table class="lines-table">
      <thead>
        <tr>
          <th class="text-left">Descripción</th>
          <th class="text-center">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">IVA</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${linesHtml}</tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(data.totales.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span>IVA:</span>
        <span>${formatCurrency(data.totales.totalIva)}</span>
      </div>
      <div class="totals-row total-final">
        <span>Total:</span>
        <span>${formatCurrency(data.totales.total)}</span>
      </div>
    </div>

    <div class="footer">
      <p class="legal-text">Presupuesto no vinculante. Documento generado electrónicamente.</p>
    </div>
  </div>
</body>
</html>`;
};
