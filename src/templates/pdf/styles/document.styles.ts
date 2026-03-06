export const documentStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12pt;
    color: #333;
    line-height: 1.6;
  }

  .document {
    padding: 20mm;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 3px solid #2c3e50;
  }

  .document-title h1 {
    font-size: 28pt;
    color: #2c3e50;
    margin-bottom: 5px;
  }

  .document-number {
    font-size: 16pt;
    color: #7f8c8d;
    font-weight: 600;
  }

  .document-date {
    text-align: right;
    font-size: 11pt;
    color: #555;
  }

  .parties {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40px;
  }

  .party {
    width: 48%;
  }

  .party h3 {
    font-size: 12pt;
    color: #2c3e50;
    margin-bottom: 10px;
    text-transform: uppercase;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 5px;
  }

  .party p {
    font-size: 11pt;
    margin-bottom: 5px;
  }

  .lines-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
  }

  .lines-table thead {
    background-color: #34495e;
    color: white;
  }

  .lines-table th,
  .lines-table td {
    padding: 12px 10px;
    border: 1px solid #ddd;
  }

  .lines-table th {
    font-weight: 600;
    font-size: 11pt;
  }

  .lines-table td {
    font-size: 11pt;
  }

  .lines-table tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }

  .totals {
    margin-left: auto;
    width: 350px;
    border-top: 2px solid #2c3e50;
    padding-top: 15px;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 12pt;
  }

  .total-final {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 2px solid #2c3e50;
    font-size: 14pt;
    color: #2c3e50;
  }

  .notes {
    margin-top: 30px;
    padding: 15px;
    background-color: #f8f9fa;
    border-left: 4px solid #3498db;
  }

  .notes h4 {
    font-size: 11pt;
    margin-bottom: 8px;
    color: #2c3e50;
  }

  .notes p {
    font-size: 10pt;
    color: #555;
    white-space: pre-wrap;
  }

  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
  }

  .legal-text {
    font-size: 9pt;
    color: #999;
    text-align: center;
  }

  @media print {
    .document {
      padding: 0;
    }
  }
`;
