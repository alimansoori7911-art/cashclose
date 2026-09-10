import { formatMoney, formatYear, getMonthName } from '@cashclose/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { YearComparison } from '../hooks/useTimeReports';
import { ComparisonTooltip } from './ComparisonTooltip';

/**
 * مقایسهٔ نظیربه‌نظیر ۱۲ ماه با سال قبل (بند ۸ سمت مالک).
 *
 * دوسری است، پس راهنمای رنگ الزامی است. جفت رنگ با ابزار اعتبارسنجی
 * آزموده شده: ΔE ۳۱ زیر پروتانوپی، بسیار بالاتر از آستانهٔ ۸ — یعنی
 * کسی که کوررنگی دارد هم دو سری را از هم تشخیص می‌دهد.
 *
 * ماه‌های نیامده رسم نمی‌شوند: میلهٔ صفر برای مهرماهی که هنوز نرسیده،
 * «افت فروش» را القا می‌کند که دروغ است.
 */
export function YearComparisonChart({ data }: { data: YearComparison }) {
  const chartData = data.months
    .filter((item) => !item.isFuture)
    .map((item) => ({
      label: getMonthName(item.month),
      current: Math.round(item.current / 100_000) / 10,
      previous: Math.round(item.previous / 100_000) / 10,
      currentRaw: item.current,
      previousRaw: item.previous,
      growthPercent: item.growthPercent,
    }));

  if (chartData.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted">
        داده‌ای برای مقایسه وجود ندارد.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text">
        مقایسه با سال گذشته
        <span className="mr-2 text-xs font-normal text-text-muted">
          (میلیون ریال)
        </span>
      </h3>

      <div className="h-72 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
            barGap={2}
          >
            <CartesianGrid
              stroke="rgb(var(--color-chart-grid))"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }}
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--color-chart-grid))' }}
            />

            <YAxis
              tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }}
              tickLine={false}
              axisLine={false}
              width={44}
            />

            <Tooltip
              content={<ComparisonTooltip data={data} />}
              cursor={{ fill: 'rgb(var(--color-surface-muted))' }}
            />

            <Legend
              wrapperStyle={{ fontSize: 12, direction: 'rtl' }}
              formatter={(value) => (
                <span style={{ color: 'rgb(var(--color-text-muted))' }}>
                  {value}
                </span>
              )}
            />

            <Bar
              dataKey="previous"
              name={`سال ${formatYear(data.previousYear)}`}
              fill="rgb(var(--color-chart-alt))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="current"
              name={`سال ${formatYear(data.year)}`}
              fill="rgb(var(--color-chart))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 border-t border-border pt-3 text-xs text-text-muted">
        جمع بازهٔ هم‌ارز: {formatMoney(data.currentTotal)} در برابر{' '}
        {formatMoney(data.comparablePrevious)} ریال
      </p>
    </div>
  );
}
