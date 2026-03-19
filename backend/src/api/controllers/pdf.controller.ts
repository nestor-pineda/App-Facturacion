import { Request, Response } from 'express';
import * as invoiceService from '@/services/invoice.service';
import * as quoteService from '@/services/quote.service';
import * as pdfService from '@/services/pdf.service';
import { renderInvoiceTemplate } from '@/templates/pdf/invoice.template';
import { renderQuoteTemplate } from '@/templates/pdf/quote.template';
import type { InvoiceTemplateData, QuoteTemplateData } from '@/types/pdf.types';

const PDF_ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type InvoiceWithLines = Awaited<ReturnType<typeof invoiceService.getById>>;
type InvoiceLine = InvoiceWithLines['lines'][number];

const mapInvoiceToTemplateData = (
  invoice: InvoiceWithLines,
): InvoiceTemplateData => ({
  tipo: 'factura',
  numero: invoice.numero ?? undefined,
  fecha: invoice.fecha_emision,
  emisor: {
    nombre: invoice.user.nombre_comercial,
    nif: invoice.user.nif,
    direccion: invoice.user.direccion_fiscal,
    telefono: invoice.user.telefono ?? undefined,
  },
  cliente: {
    nombre: invoice.client.nombre,
    nif: invoice.client.cif_nif,
    direccion: invoice.client.direccion,
    email: invoice.client.email,
  },
  lineas: invoice.lines.map((line: InvoiceLine) => ({
    descripcion: line.descripcion,
    cantidad: Number(line.cantidad),
    precioUnitario: Number(line.precio_unitario),
    ivaPorcentaje: Number(line.iva_porcentaje),
    subtotal: Number(line.subtotal),
  })),
  totales: {
    subtotal: Number(invoice.subtotal),
    totalIva: Number(invoice.total_iva),
    total: Number(invoice.total),
  },
  notas: invoice.notas ?? undefined,
});

type QuoteWithLines = Awaited<ReturnType<typeof quoteService.getById>>;
type QuoteLine = QuoteWithLines['lines'][number];

const mapQuoteToTemplateData = (
  quote: QuoteWithLines,
): QuoteTemplateData => ({
  tipo: 'presupuesto',
  numero: quote.numero ?? undefined,
  fecha: quote.fecha,
  emisor: {
    nombre: quote.user.nombre_comercial,
    nif: quote.user.nif,
    direccion: quote.user.direccion_fiscal,
    telefono: quote.user.telefono ?? undefined,
  },
  cliente: {
    nombre: quote.client.nombre,
    nif: quote.client.cif_nif,
    direccion: quote.client.direccion,
    email: quote.client.email,
  },
  lineas: quote.lines.map((line: QuoteLine) => ({
    descripcion: line.descripcion,
    cantidad: Number(line.cantidad),
    precioUnitario: Number(line.precio_unitario),
    ivaPorcentaje: Number(line.iva_porcentaje),
    subtotal: Number(line.subtotal),
  })),
  totales: {
    subtotal: Number(quote.subtotal),
    totalIva: Number(quote.total_iva),
    total: Number(quote.total),
  },
  notas: quote.notas ?? undefined,
});

/**
 * Generates and streams a PDF for an invoice.
 * Allowed for both borrador and enviada states (same as quotes).
 */
export const generateInvoicePDF = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const invoiceId = req.params.id as string;

  try {
    const invoice = await invoiceService.getById(userId, invoiceId);

    const templateData = mapInvoiceToTemplateData(invoice);
    const html = renderInvoiceTemplate(templateData);
    const pdfBuffer = await pdfService.generatePDF(html);

    const filename = invoice.numero
      ? `factura-${invoice.numero.replace('/', '-')}.pdf`
      : `factura-${invoiceId.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    if (error instanceof Error && error.message === invoiceService.INVOICE_NOT_FOUND) {
      return res.status(404).json({
        success: false,
        error: { message: 'Factura no encontrada', code: PDF_ERROR_CODES.NOT_FOUND },
      });
    }

    console.error('[pdf] Error generating invoice PDF:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error al generar el PDF', code: PDF_ERROR_CODES.INTERNAL_ERROR },
    });
  }
};

/**
 * Generates and streams a PDF for a quote.
 * Quotes in both borrador and enviado states are allowed.
 */
export const generateQuotePDF = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const quoteId = req.params.id as string;

  try {
    const quote = await quoteService.getById(userId, quoteId);

    const templateData = mapQuoteToTemplateData(quote);
    const html = renderQuoteTemplate(templateData);
    const pdfBuffer = await pdfService.generatePDF(html);

    const filename = quote.numero
      ? `presupuesto-${quote.numero.replace('/', '-')}.pdf`
      : `presupuesto-${quoteId.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    if (error instanceof Error && error.message === quoteService.QUOTE_NOT_FOUND) {
      return res.status(404).json({
        success: false,
        error: { message: 'Presupuesto no encontrado', code: PDF_ERROR_CODES.NOT_FOUND },
      });
    }

    console.error('[pdf] Error generating quote PDF:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error al generar el PDF', code: PDF_ERROR_CODES.INTERNAL_ERROR },
    });
  }
};
