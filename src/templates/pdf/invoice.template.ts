import type { InvoiceTemplateData } from '../../types/pdf.types';
import { documentStyles } from './styles/document.styles';
import { formatCurrency, formatDate, escapeHtml } from './utils/formatters';

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

  const telefonoHtml = data.emisor.telefono
    ? `<p>Tel: ${escapeHtml(data.emisor.telefono)}</p>`
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
        <p class="document-number">${escapeHtml(data.numero)}</p>
      </div>
      <div class="document-date">
        <p>Fecha: ${formatDate(data.fecha)}</p>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Emisor</h3>
        <p><strong>${escapeHtml(data.emisor.nombre)}</strong></p>
        <p>NIF: ${escapeHtml(data.emisor.nif)}</p>
        <p>${escapeHtml(data.emisor.direccion)}</p>
        ${telefonoHtml}
      </div>
      <div class="party">
        <h3>Cliente</h3>
        <p><strong>${escapeHtml(data.cliente.nombre)}</strong></p>
        <p>CIF/NIF: ${escapeHtml(data.cliente.nif)}</p>
        <p>${escapeHtml(data.cliente.direccion)}</p>
        <p>${escapeHtml(data.cliente.email)}</p>
      </div>
    </div>

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
        <span>Subtotal (Base Imponible):</span>
        <span>${formatCurrency(data.totales.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span>IVA (21%):</span>
        <span>${formatCurrency(data.totales.totalIva)}</span>
      </div>
      <div class="totals-row total-final">
        <span><strong>TOTAL:</strong></span>
        <span><strong>${formatCurrency(data.totales.total)}</strong></span>
      </div>
    </div>

    ${notesHtml}

    <div class="footer">
      <p class="legal-text">Factura sujeta a IVA. Documento generado electrónicamente.</p>
    </div>
  </div>
</body>
</html>`;
};
