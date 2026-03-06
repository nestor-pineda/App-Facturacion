import { describe, it, expect } from 'vitest';
import { renderQuoteTemplate } from '../../../../src/templates/pdf/quote.template';
import type { QuoteTemplateData } from '../../../../src/types/pdf.types';

const baseQuoteData: QuoteTemplateData = {
  tipo: 'presupuesto',
  numero: '2026/001',
  fecha: new Date('2026-03-06T12:00:00Z'),
  emisor: {
    nombre: 'Juan Pérez - Consultoría IT',
    nif: '12345678A',
    direccion: 'Calle Mayor 1, 28001 Madrid',
    telefono: '+34 600 123 456',
  },
  cliente: {
    nombre: 'Cliente Potencial SL',
    nif: 'B12345678',
    direccion: 'Gran Vía 50, 28013 Madrid',
    email: 'cliente@ejemplo.com',
  },
  lineas: [
    {
      descripcion: 'Desarrollo sitio web corporativo',
      cantidad: 1,
      precioUnitario: 2500.0,
      ivaPorcentaje: 21,
      subtotal: 2500.0,
    },
  ],
  totales: {
    subtotal: 2500.0,
    totalIva: 525.0,
    total: 3025.0,
  },
};

describe('renderQuoteTemplate', () => {
  it('should return a string starting with <!DOCTYPE html>', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toMatch(/^<!DOCTYPE html>/i);
  });

  it('should show PRESUPUESTO as the document title', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('PRESUPUESTO');
  });

  it('should NOT show FACTURA as the document title', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).not.toContain('>FACTURA<');
  });

  it('should include the quote number when provided', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('2026/001');
  });

  it('should render without quote number when numero is undefined', () => {
    const dataWithoutNumber: QuoteTemplateData = { ...baseQuoteData, numero: undefined };
    const html = renderQuoteTemplate(dataWithoutNumber);

    expect(html).toContain('PRESUPUESTO');
    expect(html).not.toContain('undefined');
  });

  it('should include the formatted date in Spanish format', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('06/03/2026');
  });

  it('should include all emitter data', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('Juan Pérez - Consultoría IT');
    expect(html).toContain('12345678A');
    expect(html).toContain('Calle Mayor 1, 28001 Madrid');
  });

  it('should include all client data', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('Cliente Potencial SL');
    expect(html).toContain('B12345678');
    expect(html).toContain('cliente@ejemplo.com');
  });

  it('should render all quote lines', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('Desarrollo sitio web corporativo');
  });

  it('should include formatted currency totals', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('2.500,00 €');
    expect(html).toContain('525,00 €');
    expect(html).toContain('3.025,00 €');
  });

  it('should not include notes section when notas is undefined', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).not.toContain('Notas:');
  });

  it('should include notes when notas is provided', () => {
    const dataWithNotes: QuoteTemplateData = {
      ...baseQuoteData,
      notas: 'Presupuesto válido 30 días.',
    };
    const html = renderQuoteTemplate(dataWithNotes);

    expect(html).toContain('Presupuesto válido 30 días.');
  });

  it('should escape HTML characters in line descriptions', () => {
    const dataWithXss: QuoteTemplateData = {
      ...baseQuoteData,
      lineas: [
        {
          descripcion: 'Diseño & <script>',
          cantidad: 1,
          precioUnitario: 100,
          ivaPorcentaje: 21,
          subtotal: 100,
        },
      ],
    };
    const html = renderQuoteTemplate(dataWithXss);

    expect(html).toContain('Diseño &amp; &lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('should include IVA percentage for each line', () => {
    const html = renderQuoteTemplate(baseQuoteData);

    expect(html).toContain('21%');
  });
});
