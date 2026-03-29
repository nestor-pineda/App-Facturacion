import axios from 'axios';
import { API_ERROR_CODES } from '@/lib/constants';

type ApiErrorResponse = {
  error?: { message?: string; code?: string };
};

/** Extracts backend error message from axios responses; otherwise returns fallback. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const msg = error.response?.data?.error?.message;
    if (typeof msg === 'string' && msg.length > 0) {
      return msg;
    }
  }
  return fallback;
}

/** 401 from login: wrong password or unknown email (same API code for both). */
export function isInvalidCredentialsError(error: unknown): boolean {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return false;
  return (
    error.response?.status === 401 &&
    error.response?.data?.error?.code === API_ERROR_CODES.INVALID_CREDENTIALS
  );
}
