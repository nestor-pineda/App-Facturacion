import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { ClientInput } from '@/schemas/client.schema';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Client } from '@/types/entities';

export const getClients = () =>
  apiClient.get<PaginatedResponse<Client>>(`${API_BASE_PATH}/clients`).then((r) => r.data);

export const createClient = (data: ClientInput) =>
  apiClient
    .post<ApiResponse<Client>>(`${API_BASE_PATH}/clients`, {
      nombre: data.nombre,
      email: data.email,
      cif_nif: data.cifNif,
      direccion: data.direccion,
      telefono: data.telefono,
    })
    .then((r) => r.data);

export const updateClient = (id: string, data: ClientInput) =>
  apiClient
    .put<ApiResponse<Client>>(`${API_BASE_PATH}/clients/${id}`, {
      nombre: data.nombre,
      email: data.email,
      cif_nif: data.cifNif,
      direccion: data.direccion,
      telefono: data.telefono,
    })
    .then((r) => r.data);
