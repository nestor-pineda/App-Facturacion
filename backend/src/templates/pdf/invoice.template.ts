import type { InvoiceTemplateData } from '@/types/pdf.types';
import { documentStyles } from '@/templates/pdf/styles/document.styles';
import { formatCurrency, formatDate, escapeHtml } from '@/templates/pdf/utils/formatters';

/**
 * Renders a complete HTML document for an invoice PDF.
 * All user-provided text fields are HTML-escaped to prevent injection.
 *
 * @param data - Typed invoice data to render into the template
 * @returns Full HTML string ready to be passed to Puppeteer
 */
export const renderInvoiceTemplate = (data: InvoiceTemplateData): string => {
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
        <h1>FACTURA</h1>
        <p class="document-subtitle">${escapeHtml(data.cliente.nombre)}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-row">
        <span class="meta-label">Fecha de emisión:</span>
        <span class="meta-value">${formatDate(data.fecha)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Cliente:</span>
        <span class="meta-value">${escapeHtml(data.cliente.nombre)}</span>
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
      <p class="legal-text">Factura sujeta a IVA. Documento generado electrónicamente.</p>
    </div>
  </div>
</body>
</html>`;
};
