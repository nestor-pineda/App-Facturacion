import { describe, it, expect } from 'vitest';
import { renderInvoiceTemplate } from '@/templates/pdf/invoice.template';
import type { InvoiceTemplateData } from '@/types/pdf.types';

const baseInvoiceData: InvoiceTemplateData = {
  tipo: 'factura',
  numero: '2026/042',
  fecha: new Date('2026-03-06T12:00:00Z'),
  emisor: {
    nombre: 'Juan Pérez - Consultoría IT',
    nif: '12345678A',
    direccion: 'Calle Mayor 1, 28001 Madrid',
    telefono: '+34 600 123 456',
  },
  cliente: {
    nombre: 'Empresa Demo SL',
    nif: 'B87654321',
    direccion: 'Av. Diagonal 100, 08019 Barcelona',
    email: 'contacto@empresademo.com',
  },
  lineas: [
    {
      descripcion: 'Desarrollo de aplicación web MVP',
      cantidad: 1,
      precioUnitario: 3000.0,
      ivaPorcentaje: 21,
      subtotal: 3000.0,
    },
    {
      descripcion: 'Consultoría técnica (10 horas)',
      cantidad: 10,
      precioUnitario: 80.0,
      ivaPorcentaje: 21,
      subtotal: 800.0,
    },
  ],
  totales: {
    subtotal: 3800.0,
    totalIva: 798.0,
    total: 4598.0,
  },
  notas: 'Pago a 30 días desde la emisión de la factura.',
};

describe('renderInvoiceTemplate', () => {
  it('should return a string starting with <!DOCTYPE html>', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toMatch(/^<!DOCTYPE html>/i);
  });

  it('should include FACTURA as the document title', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('FACTURA');
  });

  it('should include the invoice number', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('2026/042');
  });

  it('should include the formatted date in Spanish format', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('06/03/2026');
  });

  it('should include all emitter data', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('Juan Pérez - Consultoría IT');
    expect(html).toContain('12345678A');
    expect(html).toContain('Calle Mayor 1, 28001 Madrid');
    expect(html).toContain('+34 600 123 456');
  });

  it('should include all client data', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('Empresa Demo SL');
    expect(html).toContain('B87654321');
    expect(html).toContain('Av. Diagonal 100, 08019 Barcelona');
    expect(html).toContain('contacto@empresademo.com');
  });

  it('should render all invoice lines', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('Desarrollo de aplicación web MVP');
    expect(html).toContain('Consultoría técnica (10 horas)');
  });

  it('should include formatted currency totals', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('3.800,00 €');
    expect(html).toContain('798,00 €');
    expect(html).toContain('4.598,00 €');
  });

  it('should include notes when provided', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('Pago a 30 días desde la emisión de la factura.');
  });

  it('should not include notes section when notas is undefined', () => {
    const dataWithoutNotes: InvoiceTemplateData = { ...baseInvoiceData, notas: undefined };
    const html = renderInvoiceTemplate(dataWithoutNotes);

    expect(html).not.toContain('Notas:');
  });

  it('should include emitter phone when provided', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('+34 600 123 456');
  });

  it('should not render telefono section when emitter has no phone', () => {
    const dataWithoutPhone: InvoiceTemplateData = {
      ...baseInvoiceData,
      emisor: { nombre: 'Test', nif: '99999999A', direccion: 'Test St' },
    };
    const html = renderInvoiceTemplate(dataWithoutPhone);

    expect(html).not.toContain('Tel:');
  });

  it('should escape HTML characters in line descriptions', () => {
    const dataWithXss: InvoiceTemplateData = {
      ...baseInvoiceData,
      lineas: [
        {
          descripcion: 'Diseño & Desarrollo <Web>',
          cantidad: 1,
          precioUnitario: 100,
          ivaPorcentaje: 21,
          subtotal: 100,
        },
      ],
    };
    const html = renderInvoiceTemplate(dataWithXss);

    expect(html).toContain('Diseño &amp; Desarrollo &lt;Web&gt;');
    expect(html).not.toContain('<Web>');
  });

  it('should escape HTML characters in notes', () => {
    const dataWithXssNotes: InvoiceTemplateData = {
      ...baseInvoiceData,
      notas: '<script>alert("xss")</script>',
    };
    const html = renderInvoiceTemplate(dataWithXssNotes);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should include IVA percentage for each line', () => {
    const html = renderInvoiceTemplate(baseInvoiceData);

    expect(html).toContain('21%');
  });
});
