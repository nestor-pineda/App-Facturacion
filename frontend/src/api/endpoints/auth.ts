import apiClient from '@/api/client';
import { API_BASE_PATH } from '@/lib/constants';
import type { LoginInput, RegisterInput, UpdateProfileInput } from '@/schemas/auth.schema';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/entities';

const USER_EMAIL_KEY = 'email';
const USER_NIF_KEY = 'nif';
const USER_TELEFONO_KEY = 'telefono';
const USER_ID_KEY = 'id';
const USER_NOMBRE_COMERCIAL_KEY = 'nombre_comercial';
const USER_DIRECCION_FISCAL_KEY = 'direccion_fiscal';
const USER_NOMBRE_COMERCIAL_CAMEL_KEY = 'nombreComercial';
const USER_DIRECCION_FISCAL_CAMEL_KEY = 'direccionFiscal';

const mapUserFromApi = (raw: Record<string, unknown>): User => {
  const nombreComercialRaw =
    raw[USER_NOMBRE_COMERCIAL_CAMEL_KEY] ?? raw[USER_NOMBRE_COMERCIAL_KEY] ?? '';
  const direccionFiscalRaw =
    raw[USER_DIRECCION_FISCAL_CAMEL_KEY] ?? raw[USER_DIRECCION_FISCAL_KEY] ?? '';
  const telefonoRaw = raw[USER_TELEFONO_KEY];

  return {
    id: String(raw[USER_ID_KEY]),
    email: String(raw[USER_EMAIL_KEY]),
    nombreComercial: String(nombreComercialRaw),
    nif: String(raw[USER_NIF_KEY]),
    direccionFiscal: String(direccionFiscalRaw),
    telefono: telefonoRaw ? String(telefonoRaw) : undefined,
  };
};

const mapUserResponse = (payload: ApiResponse<{ user: User }>): ApiResponse<{ user: User }> => {
  if (payload?.data?.user && typeof payload.data.user === 'object') {
    return {
      ...payload,
      data: {
        ...payload.data,
        user: mapUserFromApi(payload.data.user as unknown as Record<string, unknown>),
      },
    };
  }
  return payload;
};

export const loginUser = (data: LoginInput) =>
  apiClient
    .post<ApiResponse<{ user: User }>>(`${API_BASE_PATH}/auth/login`, data)
    .then((response) => mapUserResponse(response.data));

export const registerUser = (data: RegisterInput) =>
  apiClient.post<ApiResponse<{ user: User }>>(`${API_BASE_PATH}/auth/register`, {
    email: data.email,
    password: data.password,
    nombre_comercial: data.nombreComercial,
    nif: data.nif,
    direccion_fiscal: data.direccionFiscal,
    telefono: data.telefono,
  });

export const updateCurrentUser = (data: UpdateProfileInput) =>
  apiClient
    .patch<ApiResponse<{ user: User }>>(`${API_BASE_PATH}/users/me`, {
      email: data.email,
      nombre_comercial: data.nombreComercial,
      nif: data.nif,
      direccion_fiscal: data.direccionFiscal,
      telefono: data.telefono,
    })
    .then((response) => mapUserResponse(response.data));

export const refreshToken = () =>
  apiClient.post<ApiResponse<{ message: string }>>(`${API_BASE_PATH}/auth/refresh`);

export const logoutUser = () =>
  apiClient.post<ApiResponse<{ message: string }>>(`${API_BASE_PATH}/auth/logout`);
