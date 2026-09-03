import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AttemptRecord {
  count: number;
  /** زمان پایان قفل؛ `null` یعنی قفل نیست. */
  lockedUntil: number | null;
  lastAttempt: number;
}

/**
 * محدودکردن تلاش‌های ناموفق ورود (بند ۸.۲ سند).
 *
 * پیاده‌سازی درون‌حافظه‌ای است و برای استقرار تک‌نمونه‌ای کافی است. اگر
 * روزی چند نمونه پشت Load Balancer اجرا شود، باید به Redis منتقل شود —
 * به همین دلیل پشت یک سرویس مجزا قرار گرفته تا آن تغییر فقط همین فایل
 * را لمس کند.
 */
@Injectable()
export class LoginThrottleService {
  private readonly attempts = new Map<string, AttemptRecord>();
  private readonly maxAttempts: number;
  private readonly lockoutMs: number;

  /** پنجرهٔ فراموشی تلاش‌های قدیمی و بازهٔ پاکسازی حافظه. */
  private static readonly WINDOW_MS = 15 * 60 * 1000;

  constructor(config: ConfigService) {
    this.maxAttempts = config.get<number>('LOGIN_MAX_ATTEMPTS', 5);
    this.lockoutMs =
      config.get<number>('LOGIN_LOCKOUT_MINUTES', 15) * 60 * 1000;
  }

  /**
   * اگر ورود قفل است، استثنا پرتاب می‌کند.
   *
   * ساخت پیام اینجاست تا سرویس ورود درگیر جزئیات زمان‌بندی قفل نشود.
   */
  assertNotLocked(key: string): void {
    const seconds = this.getLockRemainingSeconds(key);
    if (seconds === null) return;

    throw new UnauthorizedException(
      `به دلیل تلاش‌های ناموفق، ورود موقتاً مسدود است. ${Math.ceil(
        seconds / 60,
      )} دقیقهٔ دیگر تلاش کنید.`,
    );
  }

  /** اگر قفل باشد، تعداد ثانیه‌های باقی‌مانده؛ وگرنه `null`. */
  getLockRemainingSeconds(key: string): number | null {
    const record = this.attempts.get(key);
    if (!record?.lockedUntil) return null;

    const remaining = record.lockedUntil - Date.now();
    if (remaining <= 0) {
      this.attempts.delete(key);
      return null;
    }

    return Math.ceil(remaining / 1000);
  }

  registerFailure(key: string): void {
    this.pruneExpired();

    const now = Date.now();
    const previous = this.attempts.get(key);

    // تلاش‌های خیلی قدیمی شمارش را از صفر شروع می‌کنند.
    const count =
      previous && now - previous.lastAttempt < LoginThrottleService.WINDOW_MS
        ? previous.count + 1
        : 1;

    this.attempts.set(key, {
      count,
      lastAttempt: now,
      lockedUntil: count >= this.maxAttempts ? now + this.lockoutMs : null,
    });
  }

  /** ورود موفق، سابقهٔ تلاش‌ها را پاک می‌کند. */
  clear(key: string): void {
    this.attempts.delete(key);
  }

  /** جلوگیری از رشد بی‌پایان حافظه با ورودی‌های رهاشده. */
  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts) {
      const expired =
        now - record.lastAttempt > LoginThrottleService.WINDOW_MS &&
        (!record.lockedUntil || record.lockedUntil < now);
      if (expired) this.attempts.delete(key);
    }
  }
}
