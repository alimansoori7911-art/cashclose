import { formatMoney } from '@cashclose/shared';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { BranchSales } from '../hooks/useReports';

/**
 * مقایسهٔ فروش شعبه‌ها.
 *
 * تک‌رنگِ ترتیبی است نه رنگ‌بندی دسته‌ای: شعبه‌ها «هویت» نیستند بلکه
 * «بزرگی» را نشان می‌دهند. پررنگ‌ترین میله بیشترین فروش را دارد.
 */
export function BranchChart({ data }: { data: BranchSales[] }) {
  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted">
        داده‌ای برای مقایسه وجود ندارد.
      </p>
    );
  }

  const max = Math.max(...data.map((item) => item.sales), 1);

  const chartData = data.map((item) => ({
    name: item.branchName,
    sales: item.sales,
    millions: Math.round(item.sales / 100_000) / 10,
    // شدت رنگ متناسب با سهم فروش — همان منطق «بیشتر = پررنگ‌تر».
    opacity: 0.45 + (item.sales / max) * 0.55,
  }));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text">
        مقایسهٔ فروش شعبه‌ها
        <span className="mr-2 text-xs font-normal text-text-muted">
          (میلیون ریال)
        </span>
      </h3>

      <div className="h-56 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
          >
            <CartesianGrid
              stroke="rgb(var(--color-chart-grid))"
              strokeDasharray="3 3"
              horizontal={false}
            />

            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }}
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--color-chart-grid))' }}
            />

            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: 'rgb(var(--color-text))' }}
              tickLine={false}
              axisLine={false}
              width={110}
            />

            <Tooltip content={<BranchTooltip />} cursor={{ fill: 'transparent' }} />

            <Bar dataKey="millions" radius={[0, 4, 4, 0]} barSize={22}>
              {chartData.map((item) => (
                <Cell
                  key={item.name}
                  fill="rgb(var(--color-chart))"
                  fillOpacity={item.opacity}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipPayload {
  payload?: { name: string; sales: number };
}

function BranchTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  return (
    <div
      dir="rtl"
      className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
    >
      <p className="font-medium text-text">{item.name}</p>
      <p className="mt-1 tabular-nums text-text-muted">
        {formatMoney(item.sales)} ریال
      </p>
    </div>
  );
}
