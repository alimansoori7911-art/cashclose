import { Injectable } from '@nestjs/common';

import { isoToJalali, todayIso } from '@cashclose/shared';

import { ForecastService } from './forecast.service';
import { growthRate } from './forecast';

/**
 * مقایسهٔ نظیربه‌نظیر با سال قبل (بند ۸ سمت مالک).
 *
 * تفاوتش با `monthlyForecast`: آن یک ماه را با همان ماه سال قبل مقایسه
 * می‌کند، این هر دوازده ماه را کنار هم می‌گذارد. مدیر با یک نمودار
 * می‌فهمد رشد در کدام فصل بوده و کدام ماه عقب افتاده — چیزی که از یک
 * عدد درصدی درنمی‌آید.
 */
@Injectable()
export class YearComparisonService {
  constructor(private readonly forecast: ForecastService) {}

  async compare(tenantId: string, year: number, branchId?: string) {
    const [current, previous] = await Promise.all([
      this.forecast.monthlyTrend(tenantId, year, branchId),
      this.forecast.monthlyTrend(tenantId, year - 1, branchId),
    ]);

    const currentMonth = isoToJalali(todayIso());

    const months = current.months.map((item, index) => {
      const past = previous.months[index]?.sales ?? 0n;

      // ماه‌های آیندهٔ سال جاری هنوز نیامده‌اند؛ مقایسه‌شان با سال قبل
      // «کاهش ۱۰۰٪» نشان می‌دهد که دروغ است.
      const isFuture =
        year === currentMonth.jy && item.month > currentMonth.jm;

      return {
        month: item.month,
        current: item.sales,
        previous: past,
        growthPercent: isFuture ? null : growthRate(item.sales, past),
        isFuture,
      };
    });

    const currentTotal = sum(months.map((m) => m.current));
    const previousTotal = sum(months.map((m) => m.previous));

    // جمع سال قبل فقط تا ماه جاری، تا مقایسهٔ کل با کل منصفانه بماند:
    // ۶ ماه امسال در برابر ۱۲ ماه پارسال یعنی «افت ۵۰٪» که واقعی نیست.
    const comparableMonths = months.filter((m) => !m.isFuture);
    const comparablePrevious = sum(comparableMonths.map((m) => m.previous));

    return {
      year,
      previousYear: year - 1,
      months,
      currentTotal,
      previousTotal,
      /** رشد بر پایهٔ بازهٔ هم‌ارز — عدد قابل استناد برای تصمیم‌گیری. */
      growthPercent: growthRate(currentTotal, comparablePrevious),
      comparablePrevious,
    };
  }
}

function sum(values: bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n);
}
