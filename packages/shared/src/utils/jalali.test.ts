import { describe, expect, it } from 'vitest';

import {
  addDaysIso,
  formatJalali,
  formatJalaliCompact,
  isoToJalali,
  jalaliMonthRange,
  jalaliToIso,
  toIsoDate,
} from './jalali.js';

describe('تبدیل تاریخ جلالی', () => {
  it('نوروز ۱۴۰۵ را درست تبدیل می‌کند', () => {
    // ۱ فروردین ۱۴۰۵ برابر ۲۱ مارس ۲۰۲۶ است.
    expect(isoToJalali('2026-03-21')).toEqual({ jy: 1405, jm: 1, jd: 1 });
    expect(jalaliToIso({ jy: 1405, jm: 1, jd: 1 })).toBe('2026-03-21');
  });

  it('تاریخ نمونهٔ فایل اکسل (14050116) را بازتولید می‌کند', () => {
    const iso = jalaliToIso({ jy: 1405, jm: 1, jd: 16 });
    expect(formatJalaliCompact(iso)).toBe('14050116');
    expect(formatJalali(iso)).toBe('1405/01/16');
  });

  it('رفت‌وبرگشت تبدیل، تاریخ را تغییر نمی‌دهد', () => {
    for (const iso of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      expect(jalaliToIso(isoToJalali(iso))).toBe(iso);
    }
  });

  it('قالب نامعتبر را رد می‌کند', () => {
    expect(() => isoToJalali('2026/03/21')).toThrow(/نامعتبر/);
    expect(() => isoToJalali('not-a-date')).toThrow(/نامعتبر/);
    expect(() => isoToJalali('2026-13-01')).toThrow(/نامعتبر/);
  });
});

describe('محاسبات روی تاریخ', () => {
  it('«دیروز» را درست حساب می‌کند، حتی در مرز ماه', () => {
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysIso('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('سال کبیسهٔ میلادی را درست می‌شمارد', () => {
    expect(addDaysIso('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('toIsoDate از وقت محلی استفاده می‌کند و روز را جابه‌جا نمی‌کند', () => {
    // ساعت ۲۳:۳۰ محلی نباید به روز بعد (UTC) تبدیل شود.
    const lateNight = new Date(2026, 2, 21, 23, 30, 0);
    expect(toIsoDate(lateNight)).toBe('2026-03-21');
  });

  it('بازهٔ ماه شمسی را درست برمی‌گرداند', () => {
    // فروردین ۳۱ روز دارد.
    const range = jalaliMonthRange(1405, 1);
    expect(range.from).toBe('2026-03-21');
    expect(formatJalali(range.to)).toBe('1405/01/31');
  });

  it('اسفند سال کبیسهٔ شمسی را ۳۰ روزه می‌گیرد', () => {
    // ۱۴۰۳ سال کبیسهٔ شمسی است.
    expect(formatJalali(jalaliMonthRange(1403, 12).to)).toBe('1403/12/30');
  });
});
