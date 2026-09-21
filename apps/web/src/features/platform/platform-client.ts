import axios, { type AxiosError } from 'axios';

import { ApiError } from '../../lib/api';

/**
 * کلاینت جدا برای مسیرهای مدیر سامانه.
 *
 * چرا جدا از `api` مشترک: آن کلاینت توکن **کاربر** را خودکار ضمیمه
 * می‌کند و روی ۴۰۱ نشست کاربر را پاک کرده به صفحهٔ ورود می‌فرستد. هر دو
 * رفتار اینجا غلط است — مدیر سامانه توکن و صفحهٔ ورود خودش را دارد.
 */
const TOKEN_KEY = 'cashclose.platform-token';

export const platformSession = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // حالت خصوصی مرورگر؛ نشست تا بستن صفحه می‌ماند.
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // چیزی برای پاک‌کردن نبود.
    }
  },
};

const client = axios.create({
  baseURL: '/api/v1/platform',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = platformSession.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function toError(error: unknown): ApiError {
  const axiosError = error as AxiosError<{ message?: string }>;
  const status = axiosError.response?.status ?? 0;
  const message =
    axiosError.response?.data?.message ??
    (status === 0 ? 'ارتباط با سرور برقرار نشد.' : 'خطای ناشناخته.');

  return new ApiError(message, status);
}

export const platformApi = {
  async get<T>(url: string): Promise<T> {
    try {
      return (await client.get<T>(url)).data;
    } catch (error) {
      throw toError(error);
    }
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    try {
      return (await client.post<T>(url, body)).data;
    } catch (error) {
      throw toError(error);
    }
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    try {
      return (await client.patch<T>(url, body)).data;
    } catch (error) {
      throw toError(error);
    }
  },
};
