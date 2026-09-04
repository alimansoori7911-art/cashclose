import { CashRegisterStatus } from '@prisma/client';

import type { ReportRangeDto } from '../dto/report-filters.dto';

/**
 * ساخت شرط کوئری گزارش‌ها.
 *
 * جدا نگه داشته شده تا همهٔ گزارش‌ها دقیقاً یک تعریف از «بازه» و
 * «صندوق قابل شمارش» داشته باشند و از هم واگرا نشوند.
 */

/** شرط بازهٔ تاریخ و شعبه — بدون قید وضعیت. */
export function scopeFilter(filters: ReportRangeDto) {
  return {
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          businessDate: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
          },
        }
      : {}),
  };
}

/**
 * شرط گزارش‌های فروش.
 *
 * بند ۱۱.۷ سند: فروش **فقط** از صندوق‌های تأییدشده شمرده می‌شود.
 * صندوق در انتظار بررسی هنوز راستی‌آزمایی نشده و واردکردنش در گزارش
 * مدیریتی یعنی تصمیم‌گیری بر پایهٔ عدد تأییدنشده.
 */
export function approvedSalesFilter(
  tenantId: string,
  filters: ReportRangeDto,
) {
  return {
    tenantId,
    status: CashRegisterStatus.approved,
    ...scopeFilter(filters),
  };
}

/**
 * وضعیت‌هایی که برای گزارش‌های «واقعیت عملیاتی» شمرده می‌شوند.
 *
 * بدهی مشتری و مازاد/کسری حتی پیش از تأیید حسابدار هم واقعی‌اند و مدیر
 * باید از آن‌ها خبر داشته باشد.
 */
export const OPERATIONAL_STATUSES = [
  CashRegisterStatus.approved,
  CashRegisterStatus.submitted,
] as const;
