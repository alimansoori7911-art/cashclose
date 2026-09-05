import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

/**
 * شناسهٔ درخواست، در دسترس هر لایه بدون پاس‌دادن دستی.
 *
 * `AsyncLocalStorage` انتخاب شد چون در زنجیرهٔ async خودِ Node حمل
 * می‌شود: سرویسی که ده لایه پایین‌تر لاگ می‌نویسد بدون تغییر امضایش به
 * شناسه دسترسی دارد. جایگزینش پاس‌دادن context به همهٔ متدها بود که
 * کل کد را آلوده می‌کرد.
 */

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
  run<T>(context: RequestContext, callback: () => T): T {
    return storage.run(context, callback);
  },

  get(): RequestContext | undefined {
    return storage.getStore();
  },

  /** شناسهٔ درخواست جاری؛ بیرون از درخواست `-` برمی‌گرداند. */
  id(): string {
    return storage.getStore()?.requestId ?? '-';
  },

  /**
   * تکمیل شناسهٔ کاربر پس از احراز هویت.
   *
   * هنگام ساخت context هنوز توکن بررسی نشده، پس این فیلدها بعداً پر
   * می‌شوند تا لاگ‌های همان درخواست هم کاربر را داشته باشند.
   */
  setUser(userId: string, tenantId: string): void {
    const store = storage.getStore();
    if (store) {
      store.userId = userId;
      store.tenantId = tenantId;
    }
  },
};

/**
 * شناسهٔ درخواست از هدر یا تازه‌ساخته.
 *
 * هدر ورودی فقط وقتی پذیرفته می‌شود که شکل UUID داشته باشد: مقدار
 * دلخواه کلاینت مستقیم در لاگ می‌نشیند و می‌تواند خط لاگ را جعل کند.
 */
export function resolveRequestId(header: unknown): string {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return typeof header === 'string' && UUID_PATTERN.test(header)
    ? header
    : randomUUID();
}
