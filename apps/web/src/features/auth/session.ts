import type { UserRole } from '@cashclose/shared';

/**
 * نگهداری نشست کاربر.
 *
 * توکن در `localStorage` ذخیره می‌شود تا با رفرش صفحه از بین نرود.
 * این انتخاب در برابر XSS آسیب‌پذیر است؛ راه امن‌تر کوکی `httpOnly`
 * است که به تنظیمات دامنه و CSRF نیاز دارد و در فاز استقرار (فاز ۸)
 * انجام می‌شود. تا آن‌جا، دفاع اصلی ما پاک‌سازی ورودی‌ها و CSP است.
 */

const TOKEN_KEY = 'cashclose.token';
const USER_KEY = 'cashclose.user';

export interface SessionUser {
  id: string;
  tenantId: string;
  username: string;
  fullName: string;
  role: UserRole;
  branchId: string | null;
}

/** دسترسی به حافظهٔ مرورگر می‌تواند در حالت ناشناس خطا بدهد. */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // اگر ذخیره ممکن نباشد، نشست فقط تا رفرش بعدی دوام می‌آورد.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* بی‌اثر */
  }
}

export const session = {
  getToken: (): string | null => safeGet(TOKEN_KEY),

  getUser(): SessionUser | null {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      // دادهٔ خراب نباید کل برنامه را از کار بیندازد.
      safeRemove(USER_KEY);
      return null;
    }
  },

  save(token: string, user: SessionUser): void {
    safeSet(TOKEN_KEY, token);
    safeSet(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
  },
};
