import { formatMoney, getMonthName } from '@cashclose/shared';

import type { Forecast } from '../hooks/useReports';

/**
 * پیش‌بینی فروش ماه (بند ۷ و ۸ سند).
 *
 * عدد پیش‌بینی به‌عنوان «رقم اصلی» صفحه بزرگ نمایش داده می‌شود، و
 * اجزای محاسبه زیرش می‌آید تا مدیر بفهمد این عدد از کجا آمده — نه
 * اینکه به یک عدد بی‌پشتوانه اعتماد کند.
 */
export function ForecastCard({ data }: { data: Forecast }) {
  const progress = Math.round((data.daysElapsed / data.daysInMonth) * 100);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">
          پیش‌بینی فروش {getMonthName(data.month)} {data.year.toLocaleString('fa-IR', { useGrouping: false })}
        </h3>

        {data.growthPercent !== null && (
          <GrowthBadge percent={data.growthPercent} year={data.previousYear.year} />
        )}
      </div>

      <p className="financial-figure text-3xl font-bold text-text">
        {formatMoney(data.projectedTotal)}
        <span className="mr-2 text-sm font-normal text-text-muted">ریال</span>
      </p>

      <p className="mt-1 text-xs text-text-muted">
        {data.isComplete
          ? 'این ماه به پایان رسیده و عدد بالا فروش قطعی است.'
          : `بر پایهٔ ${data.daysElapsed.toLocaleString('fa-IR')} روز سپری‌شده از ${data.daysInMonth.toLocaleString('fa-IR')} روز`}
      </p>

      {/* نوار پیشرفت ماه — نشان می‌دهد پیش‌بینی چقدر پشتوانهٔ داده دارد. */}
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="پیشرفت ماه"
      >
        <div
          className="h-full rounded-full bg-chart transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <dl className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
        <Item label="فروش تا امروز" value={formatMoney(data.salesToDate)} />
        <Item label="میانگین روزانه" value={formatMoney(data.dailyAverage)} />
        <Item
          label={`فروش ${data.previousYear.year.toLocaleString('fa-IR', { useGrouping: false })}`}
          value={
            data.previousYear.sales > 0
              ? formatMoney(data.previousYear.sales)
              : '—'
          }
        />
      </dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="financial-figure mt-0.5 text-sm font-medium text-text">
        {value}
      </dd>
    </div>
  );
}

/**
 * نشان رشد نسبت به سال قبل.
 *
 * رنگ تنها حامل معنا نیست: علامت + یا − و متن «رشد/کاهش» هم می‌آید.
 */
function GrowthBadge({ percent, year }: { percent: number; year: number }) {
  const isUp = percent >= 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isUp ? 'bg-balanced-soft text-balanced' : 'bg-shortage-soft text-shortage'
      }`}
    >
      <span aria-hidden>{isUp ? '▲' : '▼'}</span>
      {isUp ? 'رشد' : 'کاهش'} {Math.abs(percent).toLocaleString('fa-IR')}٪
      <span className="text-text-muted">
        نسبت به {year.toLocaleString('fa-IR', { useGrouping: false })}
      </span>
    </span>
  );
}
