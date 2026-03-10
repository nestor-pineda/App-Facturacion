import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { CreateQuoteInput } from '@/schemas/quote.schema';
import type { ApiResponse } from '@/types/api';
import type { Quote, Invoice } from '@/types/entities';
import type { EstadoQuote } from '@/types/enums';

interface QuoteFilters {
  estado?: EstadoQuote;
  clientId?: string;
}

export const getQuotes = (filters?: QuoteFilters) => {
  const params = new URLSearchParams();
  if (filters?.estado) params.set('estado', filters.estado);
  if (filters?.clientId) params.set('client_id', filters.clientId);
  const qs = params.toString();
  return apiClient
    .get<ApiResponse<Quote[]>>(`${API_BASE_PATH}/quotes${qs ? `?${qs}` : ''}`)
    .then((r) => r.data);
};

const toApiPayload = (data: CreateQuoteInput) => ({
  client_id: data.clientId,
  fecha: data.fecha,
  notas: data.notas,
  lines: data.lines.map((l) => ({
    ...(l.serviceId != null && l.serviceId !== '' && { service_id: l.serviceId }),
    descripcion: l.descripcion,
    cantidad: Number(l.cantidad),
    precio_unitario: Number(l.precioUnitario),
    iva_porcentaje: Number(l.ivaPorcentaje),
  })),
});

export const createQuote = (data: CreateQuoteInput) =>
  apiClient
    .post<ApiResponse<Quote>>(`${API_BASE_PATH}/quotes`, toApiPayload(data))
    .then((r) => r.data);

export const updateQuote = (id: string, data: CreateQuoteInput) =>
  apiClient
    .put<ApiResponse<Quote>>(`${API_BASE_PATH}/quotes/${id}`, toApiPayload(data))
    .then((r) => r.data);

export const deleteQuote = (id: string) =>
  apiClient.delete<ApiResponse<null>>(`${API_BASE_PATH}/quotes/${id}`).then((r) => r.data);

export const sendQuote = (id: string) =>
  apiClient
    .patch<ApiResponse<Quote>>(`${API_BASE_PATH}/quotes/${id}/send`)
    .then((r) => r.data);

export const convertQuoteToInvoice = (id: string, fechaEmision?: string) =>
  apiClient
    .post<ApiResponse<Invoice>>(
      `${API_BASE_PATH}/quotes/${id}/convert`,
      fechaEmision ? { fecha_emision: fechaEmision } : {},
    )
    .then((r) => r.data);

export const downloadQuotePDF = (id: string) =>
  apiClient
    .get(`${API_BASE_PATH}/quotes/${id}/pdf`, { responseType: 'blob' })
    .then((r) => r.data as Blob);
