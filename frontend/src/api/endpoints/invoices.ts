import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { CreateInvoiceInput } from '@/schemas/invoice.schema';
import type { ApiResponse } from '@/types/api';
import type { Invoice, InvoiceLine, Client } from '@/types/entities';
import type { EstadoInvoice } from '@/types/enums';

interface InvoiceFilters {
  estado?: EstadoInvoice;
  clientId?: string;
}

function mapClientFromInvoiceApi(raw: Record<string, unknown>): Client {
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

function mapInvoiceLineFromApi(raw: Record<string, unknown>): InvoiceLine {
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

function mapInvoiceFromApi(raw: Record<string, unknown>): Invoice {
  const lines = (raw.lines as Record<string, unknown>[] | undefined) ?? [];
  const client = raw.client as Record<string, unknown> | undefined;
  const fechaRaw = (raw as { fecha_emision?: string }).fecha_emision ?? raw.fechaEmision;
  const fechaEmision =
    typeof fechaRaw === 'string'
      ? fechaRaw.includes('T')
        ? fechaRaw
        : fechaRaw
      : fechaRaw != null
        ? new Date(fechaRaw as Date).toISOString()
        : '';
  return {
    id: String(raw.id),
    numero: raw.numero != null ? String(raw.numero) : null,
    estado: String(raw.estado) as Invoice['estado'],
    fechaEmision,
    subtotal: Number((raw as { subtotal?: number }).subtotal) || 0,
    totalIva: Number((raw as { total_iva?: number }).total_iva) || 0,
    total: Number(raw.total) || 0,
    notas: raw.notas != null ? String(raw.notas) : undefined,
    client: client ? mapClientFromInvoiceApi(client) : ({} as Client),
    lines: lines.map((l) => mapInvoiceLineFromApi(l)),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

export const getInvoices = (filters?: InvoiceFilters) => {
  const params = new URLSearchParams();
  if (filters?.estado) params.set('estado', filters.estado);
  if (filters?.clientId) params.set('client_id', filters.clientId);
  const qs = params.toString();
  return apiClient
    .get<ApiResponse<Invoice[]>>(`${API_BASE_PATH}/invoices${qs ? `?${qs}` : ''}`)
    .then((r) => {
      const payload = r.data;
      if (payload?.data?.length) {
        return {
          ...payload,
          data: (payload.data as Record<string, unknown>[]).map(mapInvoiceFromApi),
        };
      }
      return payload;
    });
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

export const sendInvoice = async (id: string) => {
  const prep = await apiClient.post<ApiResponse<{ confirmationToken: string }>>(
    `${API_BASE_PATH}/invoices/${id}/send-confirmation`,
  );
  const token = prep.data.data?.confirmationToken;
  if (!token) {
    throw new Error('Respuesta inválida al preparar el envío de la factura');
  }
  return apiClient
    .patch<ApiResponse<Invoice>>(`${API_BASE_PATH}/invoices/${id}/send`, {
      confirmationToken: token,
    })
    .then((r) => r.data);
};

export const resendInvoice = (id: string) =>
  apiClient
    .post<ApiResponse<Invoice>>(`${API_BASE_PATH}/invoices/${id}/resend`)
    .then((r) => r.data);

export const copyInvoice = (id: string) =>
  apiClient
    .post<ApiResponse<Invoice>>(`${API_BASE_PATH}/invoices/${id}/copy`)
    .then((r) => r.data);

export const downloadInvoicePDF = (id: string) =>
  apiClient
    .get(`${API_BASE_PATH}/invoices/${id}/pdf`, { responseType: 'blob' })
    .then((r) => r.data as Blob);
