import { describe, it, expect } from 'vitest';
import {
  calculateLineSubtotal,
  calculateLineIVA,
  calculateTotals,
  formatCurrency,
  type CalculableLine,
} from './calculations';

describe('calculations', () => {
  describe('calculateLineSubtotal', () => {
    it('returns cantidad * precioUnitario', () => {
      expect(calculateLineSubtotal({ cantidad: 2, precioUnitario: 10, ivaPorcentaje: 21 })).toBe(20);
      expect(calculateLineSubtotal({ cantidad: 1, precioUnitario: 100.5, ivaPorcentaje: 0 })).toBe(100.5);
    });
  });

  describe('calculateLineIVA', () => {
    it('returns subtotal * (ivaPorcentaje / 100)', () => {
      const line: CalculableLine = { cantidad: 2, precioUnitario: 100, ivaPorcentaje: 21 };
      expect(calculateLineIVA(line)).toBe(42); // 200 * 0.21
    });
    it('returns 0 when ivaPorcentaje is 0', () => {
      const line: CalculableLine = { cantidad: 1, precioUnitario: 50, ivaPorcentaje: 0 };
      expect(calculateLineIVA(line)).toBe(0);
    });
  });

  describe('calculateTotals', () => {
    it('sums subtotal, totalIva and total for multiple lines', () => {
      const lines: CalculableLine[] = [
        { cantidad: 1, precioUnitario: 100, ivaPorcentaje: 21 },
        { cantidad: 2, precioUnitario: 50, ivaPorcentaje: 10 },
      ];
      const result = calculateTotals(lines);
      expect(result.subtotal).toBe(200); // 100 + 100
      expect(result.totalIva).toBe(31); // 21 + 10
      expect(result.total).toBe(231);
    });
    it('rounds to 2 decimal places', () => {
      const lines: CalculableLine[] = [
        { cantidad: 1, precioUnitario: 33.33, ivaPorcentaje: 21 },
      ];
      const result = calculateTotals(lines);
      expect(result.subtotal).toBe(33.33);
      expect(result.totalIva).toBe(Number((6.9993).toFixed(2))); // 7.00
      expect(result.total).toBe(Number((40.3293).toFixed(2))); // 40.33
    });
    it('returns zeros for empty lines', () => {
      const result = calculateTotals([]);
      expect(result).toEqual({ subtotal: 0, totalIva: 0, total: 0 });
    });
  });

  describe('formatCurrency', () => {
    it('formats positive amount in EUR (es-ES)', () => {
      expect(formatCurrency(100)).toMatch(/100[,.]00\s*€/);
      expect(formatCurrency(1234.56)).toMatch(/1[.\s]?234[,.]56\s*€/);
    });
    it('formats zero', () => {
      expect(formatCurrency(0)).toMatch(/0[,.]00\s*€/);
    });
    it('formats decimal amount', () => {
      const formatted = formatCurrency(99.99);
      expect(formatted).toContain('99');
      expect(formatted).toContain('99');
      expect(formatted).toContain('€');
    });
  });
});
