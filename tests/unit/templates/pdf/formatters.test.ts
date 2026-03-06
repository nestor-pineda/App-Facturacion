import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, escapeHtml } from '../../../../src/templates/pdf/utils/formatters';

describe('formatCurrency', () => {
  it('should format integer amount with € symbol in Spanish locale', () => {
    expect(formatCurrency(1200)).toBe('1.200,00 €');
  });

  it('should format decimal amount with two decimal places', () => {
    expect(formatCurrency(1200.5)).toBe('1.200,50 €');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('0,00 €');
  });

  it('should format negative amounts', () => {
    expect(formatCurrency(-50)).toBe('-50,00 €');
  });

  it('should accept string numbers', () => {
    expect(formatCurrency('3800.00')).toBe('3.800,00 €');
  });

  it('should format large amounts with thousand separators', () => {
    expect(formatCurrency(1000000)).toBe('1.000.000,00 €');
  });
});

describe('formatDate', () => {
  it('should format Date object to DD/MM/YYYY Spanish format', () => {
    expect(formatDate(new Date('2026-03-06T12:00:00Z'))).toBe('06/03/2026');
  });

  it('should format date string to DD/MM/YYYY', () => {
    expect(formatDate('2026-01-15')).toBe('15/01/2026');
  });

  it('should pad single-digit day and month with zero', () => {
    expect(formatDate(new Date('2026-01-01T12:00:00Z'))).toBe('01/01/2026');
  });
});

describe('escapeHtml', () => {
  it('should escape ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape less-than and greater-than', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('should escape all dangerous characters together', () => {
    expect(escapeHtml('Diseño & Desarrollo <Web> "Top"')).toBe(
      'Diseño &amp; Desarrollo &lt;Web&gt; &quot;Top&quot;',
    );
  });

  it('should return unchanged string when no special characters', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});
