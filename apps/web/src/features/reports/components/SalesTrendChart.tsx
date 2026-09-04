import {
  formatJalali,
  formatMoney,
  getMonthName,
  isoToJalali,
} from '@cashclose/shared';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DailySales } from '../hooks/useReports';

/**
 * نمودار روند فروش روزانه.
 *
 * تک‌سری است، پس تک‌رنگِ ترتیبی می‌گیرد و راهنمای رنگ لازم ندارد —
 * عنوان خودش سری را نام می‌برد.
 *
 * محور مبالغ به میلیون تبدیل می‌شود: نمایش «۱۲٬۵۰۰٬۰۰۰» روی هر خط
 * محور، فضا را می‌بلعد و خواندنش سخت‌تر است.
 */
export function SalesTrendChart({ data }: { data: DailySales[] }) {
  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted">
        داده‌ای برای نمایش وجود ندارد.
      </p>
    );
  }

  const chartData = data.map((item) => {
    const { jm, jd } = isoToJalali(item.date);

    return {
      date: item.date,
      // «۱۴ مرداد» به‌جای «05/14»: قالب عددی با تاریخ میلادی اشتباه
      // گرفته می‌شد و برای خوانندهٔ فارسی مبهم بود.
      label: `${jd.toLocaleString('fa-IR')} ${getMonthName(jm)}`,
      sales: item.sales,
      millions: Math.round(item.sales / 100_000) / 10,
    };
  });

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-text">
        روند فروش روزانه
        <span className="mr-2 text-xs font-normal text-text-muted">
          (میلیون ریال)
        </span>
      </h3>

      <div className="h-64 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
          >
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(var(--color-chart))"
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor="rgb(var(--color-chart))"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            {/* شبکه عمداً کم‌رنگ است تا داده جلو بیاید، نه پس‌زمینه. */}
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
              minTickGap={44}
            />

            <YAxis
              tick={{ fontSize: 11, fill: 'rgb(var(--color-text-muted))' }}
              tickLine={false}
              axisLine={false}
              width={44}
            />

            <Tooltip content={<SalesTooltip />} />

            <Area
              type="monotone"
              dataKey="millions"
              stroke="rgb(var(--color-chart))"
              strokeWidth={2}
              fill="url(#salesFill)"
              // نقطه روی هر روز، نمودار ۷۵ روزه را شلوغ می‌کند؛ فقط
              // هنگام hover نشان داده می‌شود.
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipPayload {
  payload?: { date: string; sales: number; millions: number };
}

/** راهنمای شناور با مبلغ کامل، نه عدد گردشدهٔ محور. */
function SalesTooltip({
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
      <p className="font-medium text-text">{formatJalali(item.date)}</p>
      <p className="mt-1 tabular-nums text-text-muted">
        فروش: {formatMoney(item.sales)} ریال
      </p>
    </div>
  );
}
