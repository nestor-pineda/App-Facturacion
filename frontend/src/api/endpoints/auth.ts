import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { LoginInput, RegisterInput } from '@/schemas/auth.schema';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/entities';

export const loginUser = (data: LoginInput) =>
  apiClient.post<ApiResponse<{ user: User }>>(`${API_BASE_PATH}/auth/login`, data);

export const registerUser = (data: RegisterInput) =>
  apiClient.post<ApiResponse<{ user: User }>>(`${API_BASE_PATH}/auth/register`, {
    email: data.email,
    password: data.password,
    nombre_comercial: data.nombreComercial,
    nif: data.nif,
    direccion_fiscal: data.direccionFiscal,
    telefono: data.telefono,
  });

export const refreshToken = () =>
  apiClient.post<ApiResponse<{ message: string }>>(`${API_BASE_PATH}/auth/refresh`);

export const logoutUser = () =>
  apiClient.post<ApiResponse<{ message: string }>>(`${API_BASE_PATH}/auth/logout`);
