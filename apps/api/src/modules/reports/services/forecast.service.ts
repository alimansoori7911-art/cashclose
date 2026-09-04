import { Injectable } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';

import {
  isoToJalali,
  jalaliMonthLength,
  jalaliMonthRange,
  todayIso,
} from '@cashclose/shared';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { forecastMonthlySales, growthRate } from './forecast';

/** پیش‌بینی فروش ماهانه و مقایسهٔ سال‌به‌سال. */
@Injectable()
export class ForecastService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * پیش‌بینی فروش ماه جاری (بند ۷ و ۸ سند).
   *
   * محاسبه بر پایهٔ تقویم **شمسی** انجام می‌شود، نه میلادی: مدیر
   * فروشگاه ماه را شمسی می‌بیند و پیش‌بینی بر پایهٔ ماه میلادی برایش
   * بی‌معناست.
   */
  async monthlyForecast(
    tenantId: string,
    options: { year?: number; month?: number; branchId?: string } = {},
  ) {
    const today = isoToJalali(todayIso());
    const year = options.year ?? today.jy;
    const month = options.month ?? today.jm;

    const current = await this.monthTotals(tenantId, year, month, options.branchId);
    const previous = await this.monthTotals(
      tenantId,
      year - 1,
      month,
      options.branchId,
    );

    const daysInMonth = jalaliMonthLength(year, month);

    // اگر ماه جاری است، فقط روزهای گذشته شمرده می‌شوند؛ برای ماه‌های
    // گذشته کل ماه سپری شده است.
    const isCurrentMonth = year === today.jy && month === today.jm;
    const daysElapsed = isCurrentMonth ? today.jd : daysInMonth;

    const forecast = forecastMonthlySales({
      salesToDate: current.sales,
      daysElapsed,
      daysInMonth,
    });

    return {
      year,
      month,
      ...forecast,
      previousYear: {
        year: year - 1,
        sales: previous.sales,
        registerCount: previous.count,
      },
      growthPercent: growthRate(current.sales, previous.sales),
      registerCount: current.count,
    };
  }

  /** جمع فروش تأییدشدهٔ یک ماه شمسی. */
  private async monthTotals(
    tenantId: string,
    year: number,
    month: number,
    branchId?: string,
  ): Promise<{ sales: bigint; count: number }> {
    const range = jalaliMonthRange(year, month);

    const result = await this.prisma.cashRegister.aggregate({
      where: {
        tenantId,
        status: CashRegisterStatus.approved,
        ...(branchId ? { branchId } : {}),
        businessDate: {
          gte: new Date(range.from),
          lte: new Date(range.to),
        },
      },
      _sum: { documentsTotal: true },
      _count: { id: true },
    });

    return {
      sales: result._sum.documentsTotal ?? 0n,
      count: result._count.id,
    };
  }

  /**
   * روند ماهانهٔ یک سال شمسی — برای نمودار.
   *
   * همهٔ ۱۲ ماه برگردانده می‌شوند، حتی ماه‌های بدون داده، تا نمودار
   * حفره نداشته باشد.
   */
  async monthlyTrend(tenantId: string, year: number, branchId?: string) {
    const months = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        this.monthTotals(tenantId, year, index + 1, branchId).then(
          (totals) => ({
            month: index + 1,
            sales: totals.sales,
            registerCount: totals.count,
          }),
        ),
      ),
    );

    return { year, months };
  }
}
