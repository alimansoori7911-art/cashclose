/**
 * فیلترهای مشترک گزارش‌ها.
 *
 * جدا نگه داشته شده تا هر دو دستهٔ گزارش (بازه‌محور و زمان‌محور) یک
 * تعریف داشته باشند و واردکردن یکی از دیگری، وابستگی حلقوی نسازد.
 */
export interface ReportFilters {
  // امضای اندیس لازم است تا مستقیم به `clean` پاس داده شود؛ بدون آن
  // TypeScript شیء با کلیدهای مشخص را با Record سازگار نمی‌داند.
  [key: string]: string | undefined;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

/**
 * حذف مقادیر خالی پیش از ارسال.
 *
 * پارامتر خالی در query string یعنی «فیلتر با مقدار تهی» که سرور ردش
 * می‌کند؛ نبودنش یعنی «بدون فیلتر».
 */
export function clean(
  filters: Record<string, string | number | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}
