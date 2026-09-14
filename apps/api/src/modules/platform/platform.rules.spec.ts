import { describe, expect, it } from 'vitest';

import {
  generateBusinessCode,
  isReservedSlug,
  isValidSlug,
  slugify,
} from './platform.rules';

describe('کد کسب‌وکار', () => {
  it('هشت نویسه دارد', () => {
    expect(generateBusinessCode()).toHaveLength(8);
  });

  it('نویسه‌های مبهم ندارد', () => {
    // کد پای تلفن خوانده می‌شود؛ I/O/0/1 با هم اشتباه گرفته می‌شوند.
    for (let i = 0; i < 200; i += 1) {
      expect(generateBusinessCode()).not.toMatch(/[IO01]/);
    }
  });

  it('در تکرار زیاد یکسان تولید نمی‌کند', () => {
    const codes = new Set(
      Array.from({ length: 500 }, () => generateBusinessCode()),
    );
    // با ۳۲^۸ حالت، برخورد در ۵۰۰ نمونه عملاً محال است.
    expect(codes.size).toBe(500);
  });
});

describe('ساخت زیردامنه', () => {
  it('نام لاتین را به زیردامنه تبدیل می‌کند', () => {
    expect(slugify('Refah Store')).toBe('refah-store');
  });

  it('نویسه‌های غیرمجاز را حذف می‌کند', () => {
    expect(slugify('Korosh & Co.')).toBe('korosh-co');
  });

  it('خط تیرهٔ ابتدا و انتها را برمی‌دارد', () => {
    expect(slugify('--refah--')).toBe('refah');
  });

  it('نام فارسی رشتهٔ خالی می‌دهد', () => {
    // عمدی است: زیردامنهٔ بی‌معنا بدتر از خواستن ورودی دستی است.
    expect(slugify('فروشگاه رفاه')).toBe('');
  });

  it('سقف طول DNS را رعایت می‌کند', () => {
    expect(slugify('a'.repeat(100)).length).toBeLessThanOrEqual(63);
  });
});

describe('اعتبار زیردامنه', () => {
  it('قالب درست را می‌پذیرد', () => {
    expect(isValidSlug('refah')).toBe(true);
    expect(isValidSlug('refah-store-1')).toBe(true);
  });

  it('قالب نادرست را رد می‌کند', () => {
    expect(isValidSlug('-refah')).toBe(false);
    expect(isValidSlug('refah-')).toBe(false);
    expect(isValidSlug('Refah')).toBe(false);
    expect(isValidSlug('')).toBe(false);
  });

  it('زیردامنه‌های رزروشده را می‌شناسد', () => {
    expect(isReservedSlug('api')).toBe(true);
    expect(isReservedSlug('admin')).toBe(true);
    expect(isReservedSlug('refah')).toBe(false);
  });
});
