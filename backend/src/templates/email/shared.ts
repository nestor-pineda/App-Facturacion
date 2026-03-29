/** Aligned with frontend `index.css` light theme (HSL → hex). */
const COLOR_BACKGROUND = '#fafafa';
const COLOR_CARD = '#ffffff';
const COLOR_FOREGROUND = '#121212';
const COLOR_MUTED = '#737373';
const COLOR_BORDER = '#e5e5e5';
const COLOR_SECONDARY_BG = '#f4f4f5';
const COLOR_FOOTER_TEXT = '#a3a3a3';
const COLOR_SUCCESS_BG = '#dcfce7';
const COLOR_SUCCESS_FG = '#166534';

export const formatCurrency = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

/** Same pattern as frontend `formatDateDDMMYYYY` (D-M-YYYY, no leading zeros). */
export const formatDateDashDMY = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
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
  body { margin: 0; padding: 0; background: ${COLOR_BACKGROUND}; -webkit-font-smoothing: antialiased; }
  .email-root { padding: 24px 16px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: ${COLOR_FOREGROUND}; line-height: 1.5; }
  .wrapper { max-width: 640px; margin: 0 auto; background: ${COLOR_CARD}; border: 1px solid ${COLOR_BORDER}; border-radius: 12px; overflow: hidden; }
  .inner { padding: 28px 28px 8px; }
  .doc-header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .doc-header-table td { vertical-align: top; }
  .doc-header-titles { padding-right: 12px; }
  .doc-header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: ${COLOR_FOREGROUND}; line-height: 1.2; }
  .doc-subtitle { margin: 6px 0 0; font-size: 15px; color: ${COLOR_MUTED}; }
  .status-badge { display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 6px 12px; border-radius: 9999px; background: ${COLOR_SUCCESS_BG}; color: ${COLOR_SUCCESS_FG}; white-space: nowrap; }
  .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
  .meta-grid td { width: 50%; padding: 4px 16px 4px 0; vertical-align: top; }
  .meta-label { color: ${COLOR_MUTED}; }
  .meta-value { color: ${COLOR_FOREGROUND}; }
  .intro { margin: 0 0 8px; color: ${COLOR_FOREGROUND}; }
  .intro-secondary { margin: 0 0 20px; color: ${COLOR_MUTED}; font-size: 14px; }
  .table-card { border: 1px solid ${COLOR_BORDER}; border-radius: 12px; overflow: hidden; margin: 0 0 20px; }
  .lines-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .lines-table thead th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLOR_MUTED}; padding: 12px 16px; border-bottom: 1px solid ${COLOR_BORDER}; background: ${COLOR_CARD}; }
  .lines-table thead th.num { text-align: right; }
  .lines-table tbody td { padding: 12px 16px; border-bottom: 1px solid ${COLOR_BORDER}; color: ${COLOR_FOREGROUND}; }
  .lines-table tbody tr:last-child td { border-bottom: none; }
  .lines-table tbody td.num { text-align: right; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; font-weight: 500; }
  .totals-block { border-top: 1px solid ${COLOR_BORDER}; padding-top: 16px; margin-top: 4px; text-align: right; }
  .totals-line { margin: 0 0 4px; font-size: 14px; color: ${COLOR_MUTED}; }
  .totals-line.total { margin: 12px 0 0; font-size: 18px; font-weight: 700; color: ${COLOR_FOREGROUND}; }
  .notes-box { background: ${COLOR_SECONDARY_BG}; border-radius: 8px; padding: 14px 16px; margin-top: 20px; font-size: 14px; color: ${COLOR_FOREGROUND}; white-space: pre-wrap; }
  .notes-box strong { color: ${COLOR_MUTED}; font-weight: 600; }
  .issuer-line { margin-top: 24px; font-size: 13px; color: ${COLOR_MUTED}; }
  .issuer-line strong { color: ${COLOR_FOREGROUND}; }
  .footer { padding: 16px 28px 20px; background: ${COLOR_SECONDARY_BG}; font-size: 11px; color: ${COLOR_FOOTER_TEXT}; text-align: center; border-top: 1px solid ${COLOR_BORDER}; }
`;

export const renderLinesTable = (lines: EmailLine[]): string => `
  <div class="table-card">
    <table class="lines-table">
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="num">Cantidad</th>
          <th class="num">Precio</th>
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
  </div>
`;

export const renderTotals = (subtotal: number, total_iva: number, total: number): string => `
  <div class="totals-block">
    <p class="totals-line">Subtotal: ${formatCurrency(subtotal)}</p>
    <p class="totals-line">IVA: ${formatCurrency(total_iva)}</p>
    <p class="totals-line total">Total: ${formatCurrency(total)}</p>
  </div>
`;

export const wrapHtml = (title: string, body: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-root">
    <div class="wrapper">
      <div class="inner">
        ${body}
      </div>
      <div class="footer">Este mensaje ha sido generado automáticamente. Por favor, no responda a este correo.</div>
    </div>
  </div>
</body>
</html>`.trim();
