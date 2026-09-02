import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginThrottleService } from './login-throttle.service';

function createService(maxAttempts = 3, lockoutMinutes = 15) {
  const config = {
    get: (key: string, fallback: number) =>
      key === 'LOGIN_MAX_ATTEMPTS'
        ? maxAttempts
        : key === 'LOGIN_LOCKOUT_MINUTES'
          ? lockoutMinutes
          : fallback,
  } as unknown as ConfigService;

  return new LoginThrottleService(config);
}

describe('LoginThrottleService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('در ابتدا قفل نیست', () => {
    const service = createService();
    expect(service.getLockRemainingSeconds('ali:1.1.1.1')).toBeNull();
  });

  it('پیش از رسیدن به سقف، قفل نمی‌کند', () => {
    const service = createService(3);
    service.registerFailure('ali:1.1.1.1');
    service.registerFailure('ali:1.1.1.1');

    expect(service.getLockRemainingSeconds('ali:1.1.1.1')).toBeNull();
  });

  it('با رسیدن به سقف تلاش، قفل می‌کند', () => {
    const service = createService(3);
    for (let i = 0; i < 3; i++) service.registerFailure('ali:1.1.1.1');

    const remaining = service.getLockRemainingSeconds('ali:1.1.1.1');
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(15 * 60);
  });

  it('ورود موفق سابقه را پاک می‌کند', () => {
    const service = createService(3);
    for (let i = 0; i < 3; i++) service.registerFailure('ali:1.1.1.1');

    service.clear('ali:1.1.1.1');
    expect(service.getLockRemainingSeconds('ali:1.1.1.1')).toBeNull();
  });

  it('قفل هر کاربر مستقل است', () => {
    const service = createService(3);
    for (let i = 0; i < 3; i++) service.registerFailure('ali:1.1.1.1');

    // کاربر دیگر نباید قربانی قفل شدن این یکی شود.
    expect(service.getLockRemainingSeconds('maryam:1.1.1.1')).toBeNull();
  });

  it('پس از پایان مدت قفل، دوباره اجازهٔ تلاش می‌دهد', () => {
    vi.useFakeTimers();
    const service = createService(3, 15);
    for (let i = 0; i < 3; i++) service.registerFailure('ali:1.1.1.1');

    expect(service.getLockRemainingSeconds('ali:1.1.1.1')).toBeGreaterThan(0);

    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(service.getLockRemainingSeconds('ali:1.1.1.1')).toBeNull();
  });

  it('تلاش‌های خیلی قدیمی شمارش را از نو شروع می‌کنند', () => {
    vi.useFakeTimers();
    const service = createService(3);

    service.registerFailure('ali:1.1.1.1');
    service.registerFailure('ali:1.1.1.1');

    // پس از عبور از پنجرهٔ ۱۵ دقیقه‌ای، شمارش ریست می‌شود.
    vi.advanceTimersByTime(16 * 60 * 1000);
    service.registerFailure('ali:1.1.1.1');

    expect(service.getLockRemainingSeconds('ali:1.1.1.1')).toBeNull();
  });
});
