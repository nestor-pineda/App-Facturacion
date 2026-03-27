import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { ServiceInput } from '@/schemas/service.schema';
import type { ApiResponse } from '@/types/api';
import type { Service } from '@/types/entities';

/** Map API response (snake_case, Decimal as string) to frontend Service (camelCase, number). */
function mapServiceFromApi(raw: Record<string, unknown>): Service {
  return {
    id: String(raw.id),
    nombre: String(raw.nombre),
    descripcion: raw.descripcion != null ? String(raw.descripcion) : undefined,
    precioBase: Number(raw.precio_base),
    ivaPorcentaje: Number(raw.iva_porcentaje),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
  };
}

export const getServices = () =>
  apiClient
    .get<ApiResponse<Service[]>>(`${API_BASE_PATH}/services`)
    .then((r) => {
      const payload = r.data;
      if (payload?.data?.length) {
        return { ...payload, data: payload.data.map((s: Record<string, unknown>) => mapServiceFromApi(s)) };
      }
      return payload;
    });

export const createService = (data: ServiceInput) =>
  apiClient
    .post<ApiResponse<Service>>(`${API_BASE_PATH}/services`, {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio_base: data.precioBase,
      ...(data.ivaPorcentaje !== undefined && { iva_porcentaje: data.ivaPorcentaje }),
    })
    .then((r) => {
      const payload = r.data;
      if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return { ...payload, data: mapServiceFromApi(payload.data as Record<string, unknown>) };
      }
      return payload;
    });

export const updateService = (id: string, data: ServiceInput) =>
  apiClient
    .put<ApiResponse<Service>>(`${API_BASE_PATH}/services/${id}`, {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio_base: data.precioBase,
      ...(data.ivaPorcentaje !== undefined && { iva_porcentaje: data.ivaPorcentaje }),
    })
    .then((r) => {
      const payload = r.data;
      if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return { ...payload, data: mapServiceFromApi(payload.data as Record<string, unknown>) };
      }
      return payload;
    });
