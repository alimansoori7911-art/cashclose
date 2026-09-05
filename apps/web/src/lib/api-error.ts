import { AxiosError } from 'axios';

/**
 * تبدیل خطای HTTP به خطای قابل نمایش.
 *
 * پیام سرور اولویت دارد (چون دقیق‌تر و متناسب با همان عملیات است) و
 * پیام‌های زیر فقط پشتیبان‌اند.
 */

/** پیام‌های پیش‌فرض بر اساس کد وضعیت (بند ۹.۸ سند). */
const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'اطلاعات ارسالی معتبر نیست.',
  401: 'نام کاربری یا رمز عبور اشتباه است.',
  403: 'این عملیات برای نقش شما مجاز نیست.',
  404: 'مورد درخواستی یافت نشد.',
  409: 'این عملیات با وضعیت فعلی سامانه سازگار نیست.',
  413: 'حجم فایل بیش از حد مجاز است.',
  415: 'قالب فایل پشتیبانی نمی‌شود.',
  429: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
  500: 'خطای غیرمنتظره در سرور رخ داد.',
  503: 'سرویس موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.',
};

/**
 * انتخاب گویاترین پیام از میان خطاهای اعتبارسنجی.
 *
 * `class-validator` همهٔ قواعد نقض‌شده را برمی‌گرداند و ترتیبش معکوس
 * است. برای یک فیلد خالی، پیام «حداکثر ۱۰۰۰ کاراکتر است» اول می‌آید که
 * کاملاً گیج‌کننده است — پیام «الزامی است» ریشهٔ مشکل را می‌گوید.
 */
function pickClearest(messages: string[]): string | undefined {
  if (messages.length === 0) return undefined;

  const required = messages.find((m) => m.includes('الزامی'));
  if (required) return required;

  // پیام «حداقل» از «حداکثر» مفیدتر است وقتی کاربر چیزی وارد نکرده.
  const minimum = messages.find((m) => m.includes('حداقل'));
  if (minimum) return minimum;

  return messages[0];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    /** شناسهٔ درخواست در لاگ سرور — برای پیگیری خطاهای سمت سرور. */
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * پیام همراه شناسهٔ پیگیری.
   *
   * فقط برای خطاهای سمت سرور: خطای اعتبارسنجی را کاربر خودش رفع می‌کند
   * و کد پیگیری آنجا فقط پیام را شلوغ می‌کند.
   */
  get displayMessage(): string {
    if (this.status < 500 || !this.requestId) return this.message;

    return `${this.message} (کد پیگیری: ${this.requestId.slice(0, 8)})`;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    // خطای شبکه: درخواست اصلاً به سرور نرسیده است.
    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED';
      return new ApiError(
        timedOut
          ? 'زمان پاسخ سرور به پایان رسید. دوباره تلاش کنید.'
          : 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.',
        0,
        'NETWORK_ERROR',
      );
    }

    const { status, data } = error.response;
    const payload = data as
      | { message?: string | string[]; error?: string; requestId?: string }
      | undefined;

    const raw = payload?.message;
    const message = Array.isArray(raw) ? pickClearest(raw) : raw;

    return new ApiError(
      message ?? FALLBACK_MESSAGES[status] ?? 'خطای ناشناخته.',
      status,
      payload?.error,
      payload?.requestId,
    );
  }

  return new ApiError('خطای ناشناخته.', 0);
}
