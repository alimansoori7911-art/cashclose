import { describe, expect, it, vi } from 'vitest';

import { isoToJalali, todayIso } from '@cashclose/shared';

import { YearComparisonService } from './year-comparison.service';
import type { ForecastService } from './forecast.service';

const NOW = isoToJalali(todayIso());

/** ForecastService ساختگی: ماه‌ها با مبلغ دلخواه. */
function fakeForecast(
  byYear: Record<number, bigint[]>,
): Pick<ForecastService, 'monthlyTrend'> {
  return {
    monthlyTrend: vi.fn(async (_tenant: string, year: number) => ({
      year,
      months: Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        sales: byYear[year]?.[index] ?? 0n,
        registerCount: 0,
      })),
    })),
  } as unknown as ForecastService;
}

function build(byYear: Record<number, bigint[]>) {
  return new YearComparisonService(fakeForecast(byYear) as ForecastService);
}

describe('مقایسهٔ نظیربه‌نظیر سال', () => {
  it('هر دوازده ماه با نظیرش در سال قبل جفت می‌شود', async () => {
    const service = build({
      1404: Array(12).fill(100n),
      1405: Array(12).fill(150n),
    });

    const result = await service.compare('t', 1405);

    expect(result.months).toHaveLength(12);
    expect(result.months[0]?.current).toBe(150n);
    expect(result.months[0]?.previous).toBe(100n);
    expect(result.previousYear).toBe(1404);
  });

  it('رشد هر ماه جداگانه حساب می‌شود', async () => {
    const service = build({
      1404: [100n, 200n, ...Array(10).fill(0n)],
      1405: [150n, 100n, ...Array(10).fill(0n)],
    });

    const result = await service.compare('t', 1405);

    expect(result.months[0]?.growthPercent).toBe(50);
    expect(result.months[1]?.growthPercent).toBe(-50);
  });

  it('سال قبل بدون داده، رشد را null می‌کند نه صد درصد', async () => {
    // نمایش «۱۰۰٪ رشد» وقتی پارسال صفر بوده، گمراه‌کننده است.
    const service = build({ 1405: [500n, ...Array(11).fill(0n)] });

    const result = await service.compare('t', 1405);

    expect(result.months[0]?.growthPercent).toBeNull();
  });

  it('ماه‌های نیامدهٔ سال جاری علامت می‌خورند و رشد ندارند', async () => {
    // بدون این، ماه‌های آینده «کاهش ۱۰۰٪» نشان می‌دادند.
    const service = build({
      [NOW.jy - 1]: Array(12).fill(100n),
      [NOW.jy]: Array(12).fill(0n),
    });

    const result = await service.compare('t', NOW.jy);
    const future = result.months.filter((m) => m.isFuture);

    expect(future.length).toBe(12 - NOW.jm);
    for (const month of future) {
      expect(month.growthPercent).toBeNull();
    }
  });

  it('سال‌های گذشته هیچ ماه آینده‌ای ندارند', async () => {
    const service = build({ [NOW.jy - 2]: Array(12).fill(100n) });

    const result = await service.compare('t', NOW.jy - 1);

    expect(result.months.every((m) => !m.isFuture)).toBe(true);
  });

  it('رشد کل بر پایهٔ بازهٔ هم‌ارز حساب می‌شود', async () => {
    // ۶ ماه امسال در برابر ۱۲ ماه پارسال یعنی «افت ۵۰٪» که واقعی نیست.
    const elapsed = NOW.jm;
    const current = Array.from({ length: 12 }, (_, i) =>
      i < elapsed ? 100n : 0n,
    );

    const service = build({
      [NOW.jy - 1]: Array(12).fill(100n),
      [NOW.jy]: current,
    });

    const result = await service.compare('t', NOW.jy);

    // جمع کل پارسال ۱۲۰۰ است ولی بازهٔ هم‌ارز فقط ماه‌های سپری‌شده.
    expect(result.previousTotal).toBe(1200n);
    expect(result.comparablePrevious).toBe(BigInt(elapsed * 100));
    // برابر با هم ⇒ رشد صفر، نه منفی.
    expect(result.growthPercent).toBe(0);
  });
});
