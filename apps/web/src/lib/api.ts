import axios, { AxiosError } from 'axios';

import { session } from '../features/auth/session';
import { ApiError, toApiError } from './api-error';

/**
 * کلاینت HTTP.
 *
 * مسیر پایه `/api/v1` است و در توسعه توسط پراکسی Vite به بک‌اند می‌رسد،
 * پس آدرس در توسعه و تولید یکسان می‌ماند.
 */

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/** ضمیمه‌کردن توکن به هر درخواست. */
client.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * توکن منقضی یا باطل → پاک‌کردن نشست و بازگشت به صفحهٔ ورود.
 *
 * مسیر خودِ ورود استثناست: در آنجا ۴۰۱ یعنی «رمز اشتباه» و باید به‌صورت
 * پیام خطای فرم نمایش داده شود، نه اینکه کاربر ریدایرکت شود.
 */
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      session.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export const api = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    try {
      const response = await client.post<T>(url, body);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    try {
      const response = await client.patch<T>(url, body);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async delete<T>(url: string): Promise<T> {
    try {
      const response = await client.delete<T>(url);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * ارسال فایل.
   *
   * `Content-Type` عمداً تنظیم نمی‌شود: مرورگر باید خودش آن را همراه
   * `boundary` بسازد، وگرنه سرور نمی‌تواند بدنه را تجزیه کند.
   */
  async upload<T>(url: string, formData: FormData): Promise<T> {
    try {
      const response = await client.post<T>(url, formData, {
        headers: { 'Content-Type': undefined },
        // آپلود از درخواست‌های معمولی کندتر است.
        timeout: 60_000,
      });
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export { ApiError };
export { client as axiosClient };
