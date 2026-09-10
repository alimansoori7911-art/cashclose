import { addDaysIso, todayIso } from '@cashclose/shared';
import { useState } from 'react';

import { AppLayout } from '../components/layout/AppLayout';
import { Alert } from '../components/ui/Alert/index';
import { Button } from '../components/ui/Button/index';
import { BranchChart } from '../features/reports/components/BranchChart';
import { ForecastCard } from '../features/reports/components/ForecastCard';
import { ReportFilterBar } from '../features/reports/components/ReportFilterBar';
import { SalesTrendChart } from '../features/reports/components/SalesTrendChart';
import { YearComparisonChart } from '../features/reports/components/YearComparisonChart';
import { StatusTiles } from '../features/reports/components/StatusTiles';
import { UnsettledTable } from '../features/reports/components/UnsettledTable';
import {
  exportBranchComparison,
  exportDailySales,
} from '../features/reports/csv-export';
import {
  useBranchComparison,
  useDailySales,
  useStatusSummary,
  useUnsettled,
  type ReportFilters,
} from '../features/reports/hooks/useReports';
import {
  useForecast,
  useYearComparison,
} from '../features/reports/hooks/useTimeReports';

/** داشبورد گزارش‌های مدیریتی. */
export function ReportsPage() {
  // پیش‌فرض ۳۰ روز گذشته — بازه‌ای که مدیر معمولاً می‌خواهد.
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: addDaysIso(todayIso(), -30),
    dateTo: todayIso(),
  });

  const daily = useDailySales(filters);
  const branchSales = useBranchComparison(filters);
  const status = useStatusSummary(filters);
  const forecast = useForecast(filters.branchId);
  // سال جاری؛ hook خودش سال شمسی امروز را از سرور می‌گیرد.
  const yearComparison = useYearComparison(undefined, filters.branchId);
  const unsettled = useUnsettled(filters);

  const hasError =
    daily.isError || branchSales.isError || status.isError || forecast.isError;

  return (
    <AppLayout>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">گزارش‌های مدیریتی</h1>
          <p className="mt-1 text-sm text-text-muted">
            گزارش‌های فروش فقط صندوق‌های تأییدشده را می‌شمارند.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={!daily.data?.length}
            onClick={() => daily.data && exportDailySales(daily.data)}
          >
            خروجی فروش روزانه
          </Button>
          <Button
            variant="ghost"
            disabled={!branchSales.data?.length}
            onClick={() =>
              branchSales.data && exportBranchComparison(branchSales.data)
            }
          >
            خروجی شعب
          </Button>
        </div>
      </div>

      <ReportFilterBar filters={filters} onChange={setFilters} />

      {hasError && (
        <Alert tone="error" className="mb-4">
          دریافت برخی گزارش‌ها ناموفق بود. اتصال خود را بررسی کنید.
        </Alert>
      )}

      <div className="flex flex-col gap-5">
        {status.data && <StatusTiles data={status.data} />}

        {forecast.data && <ForecastCard data={forecast.data} />}

        {daily.isPending ? (
          <ChartSkeleton />
        ) : (
          <SalesTrendChart data={daily.data ?? []} />
        )}

        {yearComparison.isPending ? (
          <ChartSkeleton />
        ) : (
          yearComparison.data && (
            <YearComparisonChart data={yearComparison.data} />
          )
        )}

        {branchSales.isPending ? (
          <ChartSkeleton />
        ) : (
          <BranchChart data={branchSales.data ?? []} />
        )}

        {unsettled.data && <UnsettledTable data={unsettled.data} />}
      </div>
    </AppLayout>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="h-64 animate-pulse rounded-lg border border-border bg-surface-muted"
      aria-busy="true"
      aria-label="در حال بارگذاری نمودار"
    />
  );
}
