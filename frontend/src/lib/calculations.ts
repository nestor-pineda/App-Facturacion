export interface CalculableLine {
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
}

export const calculateLineSubtotal = (line: CalculableLine): number =>
  line.cantidad * line.precioUnitario;

export const calculateLineIVA = (line: CalculableLine): number => {
  const subtotal = calculateLineSubtotal(line);
  return subtotal * (line.ivaPorcentaje / 100);
};

export const calculateTotals = (lines: CalculableLine[]) => {
  const subtotal = lines.reduce((acc, line) => acc + calculateLineSubtotal(line), 0);
  const totalIva = lines.reduce((acc, line) => acc + calculateLineIVA(line), 0);
  const total = subtotal + totalIva;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalIva: Number(totalIva.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

/** Formats an ISO date string to D-M-YYYY (no leading zeros). */
export const formatDateDDMMYYYY = (dateValue: string): string => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatCurrency = (amount: number): string => {
  // #region agent log
  fetch('http://127.0.0.1:7761/ingest/0f3d2f1b-d598-4961-b4fd-f4b04b3a51fe',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b3ab0'},body:JSON.stringify({sessionId:'3b3ab0',location:'calculations.ts:formatCurrency',message:'formatCurrency input',data:{amount,type:typeof amount,isNaN:Number.isNaN(Number(amount))},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
