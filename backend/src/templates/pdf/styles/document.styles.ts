export const documentStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --background: #fafafa;
    --foreground: #121212;
    --card: #ffffff;
    --muted: #f5f5f5;
    --muted-foreground: #6b7280;
    --border: #e5e7eb;
    --primary: #171717;
    --primary-foreground: #ffffff;
    --radius: 14px;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, Segoe UI, sans-serif;
    font-size: 11px;
    color: var(--foreground);
    line-height: 1.45;
    background: var(--background);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .document {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 18px;
  }

  .document-title h1 {
    font-size: 32px;
    letter-spacing: -0.02em;
    font-weight: 800;
    color: var(--foreground);
    margin-bottom: 4px;
    line-height: 1.05;
  }

  .document-subtitle {
    font-size: 20px;
    font-weight: 500;
    color: var(--muted-foreground);
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
    row-gap: 10px;
    margin-bottom: 12px;
  }

  .meta-row {
    font-size: 16px;
    color: var(--foreground);
  }

  .meta-label {
    color: var(--muted-foreground);
    margin-right: 8px;
  }

  .meta-value {
    font-weight: 500;
  }

  .notes {
    margin: 8px 0 16px;
  }

  .notes h4 {
    font-size: 15px;
    margin-bottom: 4px;
    color: var(--muted-foreground);
    font-weight: 500;
  }

  .notes p {
    font-size: 16px;
    color: var(--foreground);
    white-space: pre-wrap;
  }

  .lines-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 14px;
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }

  .lines-table thead {
    background-color: var(--muted);
    color: var(--foreground);
  }

  .lines-table th,
  .lines-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }

  .lines-table th {
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--muted-foreground);
  }

  .lines-table td {
    font-size: 12px;
    color: var(--foreground);
  }

  .lines-table tbody tr:last-child td {
    border-bottom: none;
  }

  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }

  .totals {
    margin-left: auto;
    width: 42%;
    min-width: 300px;
    border-top: 1px solid var(--border);
    padding-top: 10px;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 5px 0;
    font-size: 11px;
    color: var(--foreground);
  }

  .total-final {
    margin-top: 4px;
    padding-top: 8px;
    font-size: 15px;
    color: var(--foreground);
    font-weight: 800;
  }

  .footer {
    margin-top: 18px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .legal-text {
    font-size: 9px;
    color: var(--muted-foreground);
    text-align: center;
  }

  @page {
    size: A4;
    margin: 12mm;
  }

  @media print {
    .document {
      padding: 0;
      border: 0;
      border-radius: 0;
    }
  }
`;
