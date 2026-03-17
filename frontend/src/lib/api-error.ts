import axios from 'axios';

type ApiErrorResponse = {
  error?: { message?: string };
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
