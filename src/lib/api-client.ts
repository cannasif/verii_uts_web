import axios from 'axios';
import i18n from '@/lib/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { getApiBaseUrl } from '@/lib/app-config';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'x-language': 'tr',
  },
});

apiClient.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().token ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['x-language'] = i18n.language || 'tr';

  return config;
});

export function setApiBaseUrl(url: string): void {
  apiClient.defaults.baseURL = url;
}

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.[0] ||
      error?.message ||
      i18n.t('unexpectedError', { ns: 'common' });

    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?sessionExpired=true';
      }
    }

    return Promise.reject(new Error(message));
  },
);
