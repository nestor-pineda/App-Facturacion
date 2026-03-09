import type { EstadoInvoice, EstadoQuote } from './enums';

export interface User {
  id: string;
  email: string;
  nombreComercial: string;
  nif: string;
  direccionFiscal: string;
  telefono?: string;
}

export interface Client {
  id: string;
  nombre: string;
  email: string;
  cifNif: string;
  direccion: string;
  telefono?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  ivaPorcentaje: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  serviceId: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  numero: string | null;
  estado: EstadoInvoice;
  fechaEmision: string;
  subtotal: number;
  totalIva: number;
  total: number;
  notas?: string;
  client: Client;
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLine {
  id: string;
  serviceId: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  numero?: string | null;
  estado: EstadoQuote;
  fecha: string;
  subtotal: number;
  totalIva: number;
  total: number;
  notas?: string;
  client: Client;
  lines: QuoteLine[];
  createdAt: string;
  updatedAt: string;
}
