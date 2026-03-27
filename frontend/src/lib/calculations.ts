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
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
