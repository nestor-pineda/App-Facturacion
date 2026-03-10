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
      // #region agent log
      const raw = r.data?.data?.[0];
      if (raw) {
        fetch('http://127.0.0.1:7761/ingest/0f3d2f1b-d598-4961-b4fd-f4b04b3a51fe',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b3ab0'},body:JSON.stringify({sessionId:'3b3ab0',location:'services.ts:getServices',message:'API first service shape',data:{keys:Object.keys(raw),precio_base:(raw as Record<string,unknown>).precio_base,precioBase:(raw as Record<string,unknown>).precioBase,iva_porcentaje:(raw as Record<string,unknown>).iva_porcentaje,ivaPorcentaje:(raw as Record<string,unknown>).ivaPorcentaje},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      }
      // #endregion
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
    })
    .then((r) => {
      const payload = r.data;
      if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return { ...payload, data: mapServiceFromApi(payload.data as Record<string, unknown>) };
      }
      return payload;
    });
