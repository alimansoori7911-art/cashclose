import { formatRial } from '@cashclose/shared';

import type { VersionComparison } from '../hooks/useReviewApi';

/** مبلغ رشته‌ای payload را به نمایش ریالی تبدیل می‌کند. */
export function amountText(value: string | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return formatRial(BigInt(value));
}

/**
 * جمع‌های کلی دو نسخه.
 *
 * وقتی مقداری عوض شده، هر دو نمایش داده می‌شوند: قدیمی خط‌خورده و
 * جدید پررنگ — تا حسابدار تغییر را در یک نگاه ببیند.
 */
export function DiffTotals({
  totals,
}: {
  totals: VersionComparison['diff']['totals'];
}) {
  const items = [
    { key: 'registerBalance', label: 'مانده صندوق' },
    { key: 'documentsTotal', label: 'جمع اسناد' },
    { key: 'difference', label: 'اختلاف' },
  ] as const;

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {items.map(({ key, label }) => {
        const item = totals[key];

        return (
          <div
            key={key}
            className={`rounded-lg border p-3 ${
              item.changed
                ? 'border-warning bg-warning-soft/30'
                : 'border-border bg-surface'
            }`}
          >
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="mt-1 flex flex-col gap-0.5 text-sm">
              {item.changed ? (
                <>
                  <span className="tabular-nums text-text-muted line-through">
                    {amountText(item.before)}
                  </span>
                  <span className="tabular-nums font-semibold text-text">
                    {amountText(item.after)}
                  </span>
                </>
              ) : (
                <span className="tabular-nums text-text">
                  {amountText(item.after)}
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
