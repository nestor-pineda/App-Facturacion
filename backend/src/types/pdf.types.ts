export interface DocumentParty {
  nombre: string;
  nif: string;
  direccion: string;
  telefono?: string;
  email?: string;
}

export interface DocumentLine {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
}

export interface DocumentTotals {
  subtotal: number;
  totalIva: number;
  total: number;
}

export interface InvoiceTemplateData {
  tipo: 'factura';
  numero?: string;
  fecha: Date;
  emisor: DocumentParty;
  cliente: Omit<DocumentParty, 'telefono'> & { email: string };
  lineas: DocumentLine[];
  totales: DocumentTotals;
  notas?: string;
}

export interface QuoteTemplateData {
  tipo: 'presupuesto';
  numero?: string;
  fecha: Date;
  emisor: DocumentParty;
  cliente: Omit<DocumentParty, 'telefono'> & { email: string };
  lineas: DocumentLine[];
  totales: DocumentTotals;
  notas?: string;
}

export type DocumentTemplateData = InvoiceTemplateData | QuoteTemplateData;
