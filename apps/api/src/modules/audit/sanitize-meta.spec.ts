import { describe, expect, it } from 'vitest';

import { sanitizeMeta } from './sanitize-meta';

describe('پاک‌سازی meta لاگ', () => {
  it('کلیدهای حساس را حذف می‌کند', () => {
    // مهم‌ترین تست این فایل: بدون آن، ویرایش کاربر می‌توانست رمز خام را
    // در لاگ ممیزی بنویسد.
    const result = sanitizeMeta({
      username: 'cashier1',
      password: 'Secret@1404',
      newPassword: 'Another@1404',
      passwordHash: '$argon2id$...',
      token: 'jwt-token',
    }) as Record<string, unknown>;

    expect(result.username).toBe('cashier1');
    expect(result.password).toBe('[حذف‌شده]');
    expect(result.newPassword).toBe('[حذف‌شده]');
    expect(result.passwordHash).toBe('[حذف‌شده]');
    expect(result.token).toBe('[حذف‌شده]');
  });

  it('کلیدهای حساس تودرتو را هم حذف می‌کند', () => {
    const result = sanitizeMeta({
      changes: { fullName: 'علی', password: 'Secret@1404' },
    }) as { changes: Record<string, unknown> };

    expect(result.changes.fullName).toBe('علی');
    expect(result.changes.password).toBe('[حذف‌شده]');
  });

  it('مقادیر undefined را حذف می‌کند', () => {
    // Prisma مقدار undefined را در JSON نمی‌پذیرد و خطا می‌دهد.
    const result = sanitizeMeta({
      role: 'cashier',
      branchId: undefined,
    }) as Record<string, unknown>;

    expect(result).toEqual({ role: 'cashier' });
    expect('branchId' in result).toBe(false);
  });

  it('BigInt را به رشته تبدیل می‌کند', () => {
    const result = sanitizeMeta({ amount: 16_000_000n }) as Record<
      string,
      unknown
    >;
    expect(result.amount).toBe('16000000');
  });

  it('تاریخ را به ISO تبدیل می‌کند', () => {
    const date = new Date('2026-04-27T00:00:00.000Z');
    const result = sanitizeMeta({ at: date }) as Record<string, unknown>;
    expect(result.at).toBe('2026-04-27T00:00:00.000Z');
  });

  it('رشتهٔ خیلی بلند را کوتاه می‌کند', () => {
    const result = sanitizeMeta({ note: 'x'.repeat(5000) }) as Record<
      string,
      unknown
    >;
    expect((result.note as string).length).toBeLessThan(1100);
  });

  it('عمق زیاد را محدود می‌کند', () => {
    // شیء تودرتوی عمیق نباید ستون JSON را پر کند یا باعث خطا شود.
    let deep: Record<string, unknown> = { value: 'ته' };
    for (let i = 0; i < 20; i++) deep = { nested: deep };

    expect(() => sanitizeMeta(deep)).not.toThrow();
    expect(JSON.stringify(sanitizeMeta(deep))).toContain('عمق بیش از حد');
  });

  it('ورودی خالی را undefined برمی‌گرداند', () => {
    expect(sanitizeMeta(undefined)).toBeUndefined();
  });

  it('آرایه را حفظ می‌کند ولی محدود', () => {
    const result = sanitizeMeta({
      items: Array.from({ length: 100 }, (_, i) => i),
    }) as { items: unknown[] };

    expect(result.items).toHaveLength(50);
  });
});
