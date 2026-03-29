import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import {
  API_BASE_PATH,
  BROWSER_MUTATION_HEADER_NAME,
  BROWSER_MUTATION_HEADER_VALUE,
} from '@/lib/constants';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
    [BROWSER_MUTATION_HEADER_NAME]: BROWSER_MUTATION_HEADER_VALUE,
  },
  withCredentials: true,
});

const refreshRequestConfig = {
  withCredentials: true,
  headers: {
    [BROWSER_MUTATION_HEADER_NAME]: BROWSER_MUTATION_HEADER_VALUE,
  },
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || ''}${API_BASE_PATH}/auth/refresh`,
          {},
          refreshRequestConfig,
        );
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
