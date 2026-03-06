export const formatCurrency = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
};

export interface EmailLine {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva_porcentaje: number;
  subtotal: number;
}

const baseStyles = `
  body { font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
  .wrapper { max-width: 640px; margin: 32px auto; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
  .header { background: #2c3e50; color: #fff; padding: 28px 32px; }
  .header h1 { margin: 0 0 4px; font-size: 22px; }
  .header p { margin: 0; font-size: 13px; opacity: .8; }
  .body { padding: 28px 32px; }
  .greeting { font-size: 15px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
  th { background: #34495e; color: #fff; padding: 10px 8px; text-align: left; }
  th.num { text-align: right; }
  td { padding: 9px 8px; border-bottom: 1px solid #eee; }
  td.num { text-align: right; }
  tr:nth-child(even) td { background: #fafafa; }
  .totals { margin-left: auto; width: 280px; margin-top: 8px; font-size: 14px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
  .totals-row.final { font-weight: bold; font-size: 16px; border-top: 2px solid #2c3e50; padding-top: 10px; margin-top: 6px; color: #2c3e50; }
  .notes { background: #f8f9fa; border-left: 4px solid #3498db; padding: 12px 16px; margin-top: 20px; font-size: 13px; white-space: pre-wrap; }
  .footer { padding: 16px 32px; background: #f5f5f5; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; }
`;

export const renderLinesTable = (lines: EmailLine[]): string => `
  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th class="num">Cant.</th>
        <th class="num">Precio unit.</th>
        <th class="num">IVA</th>
        <th class="num">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${lines
        .map(
          (l) => `
        <tr>
          <td>${escapeHtml(l.descripcion)}</td>
          <td class="num">${l.cantidad}</td>
          <td class="num">${formatCurrency(l.precio_unitario)}</td>
          <td class="num">${l.iva_porcentaje}%</td>
          <td class="num">${formatCurrency(l.subtotal)}</td>
        </tr>`,
        )
        .join('')}
    </tbody>
  </table>
`;

export const renderTotals = (subtotal: number, total_iva: number, total: number): string => `
  <div class="totals">
    <div class="totals-row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
    <div class="totals-row"><span>IVA:</span><span>${formatCurrency(total_iva)}</span></div>
    <div class="totals-row final"><span>Total:</span><span>${formatCurrency(total)}</span></div>
  </div>
`;

export const wrapHtml = (title: string, body: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    ${body}
    <div class="footer">Este mensaje ha sido generado automáticamente. Por favor, no responda a este correo.</div>
  </div>
</body>
</html>`.trim();
