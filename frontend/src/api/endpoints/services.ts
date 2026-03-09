import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { ServiceInput } from '@/schemas/service.schema';
import type { ApiResponse } from '@/types/api';
import type { Service } from '@/types/entities';

export const getServices = () =>
  apiClient
    .get<ApiResponse<Service[]>>(`${API_BASE_PATH}/services`)
    .then((r) => r.data);

export const createService = (data: ServiceInput) =>
  apiClient
    .post<ApiResponse<Service>>(`${API_BASE_PATH}/services`, {
      nombre: data.nombre,
      descripcion: data.descripcion,
      precio_base: data.precioBase,
    })
    .then((r) => r.data);
