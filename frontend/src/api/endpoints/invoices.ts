import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { CreateInvoiceInput } from '@/schemas/invoice.schema';
import type { ApiResponse } from '@/types/api';
import type { Invoice } from '@/types/entities';
import type { EstadoInvoice } from '@/types/enums';

interface InvoiceFilters {
  estado?: EstadoInvoice;
  clientId?: string;
}

export const getInvoices = (filters?: InvoiceFilters) => {
  const params = new URLSearchParams();
  if (filters?.estado) params.set('estado', filters.estado);
  if (filters?.clientId) params.set('client_id', filters.clientId);
  const qs = params.toString();
  return apiClient
    .get<ApiResponse<Invoice[]>>(`${API_BASE_PATH}/invoices${qs ? `?${qs}` : ''}`)
    .then((r) => r.data);
};

const toApiPayload = (data: CreateInvoiceInput) => ({
  client_id: data.clientId,
  fecha_emision: data.fechaEmision,
  notas: data.notas,
  lines: data.lines.map((l) => ({
    ...(l.serviceId != null && l.serviceId !== '' && { service_id: l.serviceId }),
    descripcion: l.descripcion,
    cantidad: Number(l.cantidad),
    precio_unitario: Number(l.precioUnitario),
    iva_porcentaje: Number(l.ivaPorcentaje),
  })),
});

export const createInvoice = (data: CreateInvoiceInput) =>
  apiClient
    .post<ApiResponse<Invoice>>(`${API_BASE_PATH}/invoices`, toApiPayload(data))
    .then((r) => r.data);

export const updateInvoice = (id: string, data: CreateInvoiceInput) =>
  apiClient
    .put<ApiResponse<Invoice>>(`${API_BASE_PATH}/invoices/${id}`, toApiPayload(data))
    .then((r) => r.data);

export const deleteInvoice = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`${API_BASE_PATH}/invoices/${id}`).then((r) => r.data);

export const sendInvoice = (id: string) =>
  apiClient
    .patch<ApiResponse<Invoice>>(`${API_BASE_PATH}/invoices/${id}/send`)
    .then((r) => r.data);

export const copyInvoice = (id: string) =>
  apiClient
    .post<ApiResponse<Invoice>>(`${API_BASE_PATH}/invoices/${id}/copy`)
    .then((r) => r.data);

export const downloadInvoicePDF = (id: string) =>
  apiClient
    .get(`${API_BASE_PATH}/invoices/${id}/pdf`, { responseType: 'blob' })
    .then((r) => r.data as Blob);
