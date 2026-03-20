import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { ClientInput } from '@/schemas/client.schema';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Client } from '@/types/entities';

/** Map API response (snake_case) to frontend Client (camelCase). */
function mapClientFromApi(raw: Record<string, unknown>): Client {
  const telefonoRaw = raw.telefono != null ? String(raw.telefono).trim() : '';
  return {
    id: String(raw.id),
    nombre: String(raw.nombre),
    email: String(raw.email),
    cifNif: String((raw as { cif_nif?: string }).cif_nif ?? ''),
    direccion: String(raw.direccion),
    telefono: telefonoRaw || undefined,
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

export const getClients = () =>
  apiClient.get<PaginatedResponse<Client>>(`${API_BASE_PATH}/clients`).then((r) => {
    const payload = r.data;
    if (payload?.data?.length) {
      return {
        ...payload,
        data: (payload.data as Record<string, unknown>[]).map(mapClientFromApi),
      };
    }
    return payload;
  });

export const createClient = (data: ClientInput) =>
  apiClient
    .post<ApiResponse<Client>>(`${API_BASE_PATH}/clients`, {
      nombre: data.nombre,
      email: data.email,
      cif_nif: data.cifNif,
      direccion: data.direccion,
      telefono: data.telefono,
    })
    .then((r) => {
      const payload = r.data;
      if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return { ...payload, data: mapClientFromApi(payload.data as Record<string, unknown>) };
      }
      return payload;
    });

export const updateClient = (id: string, data: ClientInput) =>
  apiClient
    .put<ApiResponse<Client>>(`${API_BASE_PATH}/clients/${id}`, {
      nombre: data.nombre,
      email: data.email,
      cif_nif: data.cifNif,
      direccion: data.direccion,
      telefono: data.telefono,
    })
    .then((r) => {
      const payload = r.data;
      if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return { ...payload, data: mapClientFromApi(payload.data as Record<string, unknown>) };
      }
      return payload;
    });
