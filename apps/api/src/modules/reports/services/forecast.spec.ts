import { describe, expect, it } from 'vitest';

import { forecastMonthlySales, growthRate } from './forecast';

describe('پیش‌بینی فروش ماهانه', () => {
  it('مثال دقیق سند را بازتولید می‌کند', () => {
    // بند ۷ سند: «امروز ۱۳ام ماه است، جمع فروش تا ۱۳ام تقسیم بر ۱۳
    // می‌شود تا متوسط روزانه دربیاید، بعد تا پایان ماه پیش‌بینی شود.»
    const result = forecastMonthlySales({
      salesToDate: 130_000_000n,
      daysElapsed: 13,
      daysInMonth: 31,
    });

    expect(result.dailyAverage).toBe(10_000_000n);
    expect(result.projectedTotal).toBe(310_000_000n);
    expect(result.daysRemaining).toBe(18);
    expect(result.isComplete).toBe(false);
  });

  it('ماه تمام‌شده را پیش‌بینی نمی‌داند', () => {
    const result = forecastMonthlySales({
      salesToDate: 300_000_000n,
      daysElapsed: 30,
      daysInMonth: 30,
    });

    expect(result.isComplete).toBe(true);
    expect(result.daysRemaining).toBe(0);
    expect(result.projectedTotal).toBe(300_000_000n);
  });

  it('ابتدای ماه بدون داده، پیش‌بینی صفر می‌دهد', () => {
    // تقسیم بر صفر نباید رخ دهد.
    const result = forecastMonthlySales({
      salesToDate: 0n,
      daysElapsed: 0,
      daysInMonth: 31,
    });

    expect(result.dailyAverage).toBe(0n);
    expect(result.projectedTotal).toBe(0n);
  });

  it('روز سپری‌شدهٔ بیش از طول ماه را مهار می‌کند', () => {
    const result = forecastMonthlySales({
      salesToDate: 310_000_000n,
      daysElapsed: 45,
      daysInMonth: 31,
    });

    expect(result.daysElapsed).toBe(31);
    expect(result.daysRemaining).toBe(0);
  });

  it('روز سپری‌شدهٔ منفی را مهار می‌کند', () => {
    const result = forecastMonthlySales({
      salesToDate: 0n,
      daysElapsed: -5,
      daysInMonth: 30,
    });

    expect(result.daysElapsed).toBe(0);
  });

  it('اسفند ۳۰ روزهٔ سال کبیسه را درست حساب می‌کند', () => {
    const result = forecastMonthlySales({
      salesToDate: 50_000_000n,
      daysElapsed: 10,
      daysInMonth: 30,
    });

    expect(result.dailyAverage).toBe(5_000_000n);
    expect(result.projectedTotal).toBe(150_000_000n);
  });

  it('مبالغ بسیار بزرگ را بدون سرریز محاسبه می‌کند', () => {
    const huge = 9_007_199_254_740_993n; // بیش از MAX_SAFE_INTEGER
    const result = forecastMonthlySales({
      salesToDate: huge,
      daysElapsed: 1,
      daysInMonth: 31,
    });

    expect(result.projectedTotal).toBe(huge * 31n);
  });
});

describe('نرخ رشد سال‌به‌سال', () => {
  it('رشد مثبت را درست حساب می‌کند', () => {
    expect(growthRate(150_000_000n, 100_000_000n)).toBe(50);
  });

  it('کاهش را منفی گزارش می‌کند', () => {
    expect(growthRate(80_000_000n, 100_000_000n)).toBe(-20);
  });

  it('بدون تغییر، صفر می‌دهد', () => {
    expect(growthRate(100_000_000n, 100_000_000n)).toBe(0);
  });

  it('وقتی سال قبل داده نداشته، null می‌دهد', () => {
    // نمایش «۱۰۰٪ رشد» در این حالت گمراه‌کننده است.
    expect(growthRate(100_000_000n, 0n)).toBeNull();
  });

  it('تا یک رقم اعشار گرد می‌کند', () => {
    expect(growthRate(133_000_000n, 100_000_000n)).toBe(33);
    expect(growthRate(133_500_000n, 100_000_000n)).toBe(33.5);
  });
});
