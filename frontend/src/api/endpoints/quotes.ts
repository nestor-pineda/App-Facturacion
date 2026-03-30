import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { CreateQuoteInput } from '@/schemas/quote.schema';
import type { ApiResponse } from '@/types/api';
import type { Quote, QuoteLine, Client, Invoice } from '@/types/entities';
import type { EstadoQuote } from '@/types/enums';

interface QuoteFilters {
  estado?: EstadoQuote;
  clientId?: string;
}

function mapClientFromQuoteApi(raw: Record<string, unknown>): Client {
  return {
    id: String(raw.id),
    nombre: String(raw.nombre),
    email: String(raw.email),
    cifNif: String((raw as { cif_nif?: string }).cif_nif ?? ''),
    direccion: String(raw.direccion),
    telefono: raw.telefono != null ? String(raw.telefono) : undefined,
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

function mapQuoteLineFromApi(raw: Record<string, unknown>): QuoteLine {
  return {
    id: String(raw.id),
    serviceId: (raw as { service_id?: string | null }).service_id ?? null,
    descripcion: String(raw.descripcion),
    cantidad: Number((raw as { cantidad?: number }).cantidad) || 0,
    precioUnitario: Number((raw as { precio_unitario?: number }).precio_unitario) || 0,
    ivaPorcentaje: Number((raw as { iva_porcentaje?: number }).iva_porcentaje) || 0,
    subtotal: Number((raw as { subtotal?: number }).subtotal) || 0,
  };
}

function mapQuoteFromApi(raw: Record<string, unknown>): Quote {
  const lines = (raw.lines as Record<string, unknown>[] | undefined) ?? [];
  const client = raw.client as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    numero: raw.numero != null ? String(raw.numero) : null,
    estado: String(raw.estado) as Quote['estado'],
    fecha: raw.fecha != null ? (typeof raw.fecha === 'string' ? raw.fecha : new Date(raw.fecha as Date).toISOString()) : '',
    subtotal: Number((raw as { subtotal?: number }).subtotal) || 0,
    totalIva: Number((raw as { total_iva?: number }).total_iva) || 0,
    total: Number(raw.total) || 0,
    notas: raw.notas != null ? String(raw.notas) : undefined,
    client: client ? mapClientFromQuoteApi(client) : ({} as Client),
    lines: lines.map((l) => mapQuoteLineFromApi(l)),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

export const getQuotes = (filters?: QuoteFilters) => {
  const params = new URLSearchParams();
  if (filters?.estado) params.set('estado', filters.estado);
  if (filters?.clientId) params.set('client_id', filters.clientId);
  const qs = params.toString();
  return apiClient
    .get<ApiResponse<Quote[]>>(`${API_BASE_PATH}/quotes${qs ? `?${qs}` : ''}`)
    .then((r) => {
      const payload = r.data;
      if (payload?.data?.length) {
        return { ...payload, data: (payload.data as Record<string, unknown>[]).map(mapQuoteFromApi) };
      }
      return payload;
    });
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

export const sendQuote = async (id: string) => {
  const prep = await apiClient.post<ApiResponse<{ confirmationToken: string }>>(
    `${API_BASE_PATH}/quotes/${id}/send-confirmation`,
  );
  const token = prep.data.data?.confirmationToken;
  if (!token) {
    throw new Error('Respuesta inválida al preparar el envío del presupuesto');
  }
  return apiClient
    .patch<ApiResponse<Quote>>(`${API_BASE_PATH}/quotes/${id}/send`, {
      confirmationToken: token,
    })
    .then((r) => r.data);
};

export const resendQuote = (id: string) =>
  apiClient
    .post<ApiResponse<Quote>>(`${API_BASE_PATH}/quotes/${id}/resend`)
    .then((r) => r.data);

export const copyQuote = (id: string) =>
  apiClient
    .post<ApiResponse<Quote>>(`${API_BASE_PATH}/quotes/${id}/copy`)
    .then((r) => {
      const payload = r.data;
      if (payload?.data && typeof payload.data === 'object') {
        return { ...payload, data: mapQuoteFromApi(payload.data as Record<string, unknown>) };
      }
      return payload;
    });

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
