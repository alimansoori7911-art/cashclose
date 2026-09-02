import axios, { AxiosError } from 'axios';

import { session } from '../features/auth/session';

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

/** پیام‌های خطای استاندارد بک‌اند (بند ۹.۸ سند). */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'اطلاعات ارسالی معتبر نیست.',
  401: 'نام کاربری یا رمز عبور اشتباه است.',
  403: 'این عملیات برای نقش شما مجاز نیست.',
  404: 'مورد درخواستی یافت نشد.',
  409: 'این عملیات با وضعیت فعلی سامانه سازگار نیست.',
  413: 'حجم فایل بیش از حد مجاز است.',
  415: 'قالب فایل پشتیبانی نمی‌شود.',
  429: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
  500: 'خطای غیرمنتظره در سرور رخ داد.',
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    // خطای شبکه: درخواست اصلاً به سرور نرسیده است.
    if (!error.response) {
      return new ApiError(
        'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.',
        0,
        'NETWORK_ERROR',
      );
    }

    const { status, data } = error.response;
    const payload = data as { message?: string; error?: string } | undefined;

    return new ApiError(
      payload?.message ?? ERROR_MESSAGES[status] ?? 'خطای ناشناخته.',
      status,
      payload?.error,
    );
  }

  return new ApiError('خطای ناشناخته.', 0);
}

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
};

export { client as axiosClient };
