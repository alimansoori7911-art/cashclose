import { formatMoney, formatYear } from '@cashclose/shared';

import type { YearComparison } from '../hooks/useTimeReports';

interface Row {
  label: string;
  currentRaw: number;
  previousRaw: number;
  growthPercent: number | null;
}

/**
 * راهنمای شناور مقایسهٔ سال.
 *
 * مبلغ کامل نشان می‌دهد نه عدد گردشدهٔ محور، و درصد رشد را با متن صریح
 * («رشد»/«کاهش») می‌آورد — علامت مثبت و منفی به‌تنهایی در نگاه سریع گم
 * می‌شود.
 */
export function ComparisonTooltip({
  active,
  payload,
  data,
}: {
  active?: boolean;
  payload?: { payload?: Row }[];
  data: YearComparison;
}) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  const growth = item.growthPercent;

  return (
    <div
      dir="rtl"
      className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
    >
      <p className="mb-1.5 font-medium text-text">{item.label}</p>

      <p className="tabular-nums text-text-muted">
        سال {formatYear(data.year)}:{' '}
        {formatMoney(item.currentRaw)}
      </p>
      <p className="tabular-nums text-text-muted">
        سال {formatYear(data.previousYear)}:{' '}
        {formatMoney(item.previousRaw)}
      </p>

      {growth !== null && (
        <p
          className={`mt-1.5 border-t border-border pt-1.5 tabular-nums ${
            growth >= 0 ? 'text-balanced' : 'text-shortage'
          }`}
        >
          {growth >= 0 ? 'رشد' : 'کاهش'}{' '}
          {Math.abs(growth).toLocaleString('fa-IR')}٪
        </p>
      )}

      {growth === null && (
        <p className="mt-1.5 border-t border-border pt-1.5 text-text-muted">
          سال قبل داده‌ای ندارد
        </p>
      )}
    </div>
  );
}
