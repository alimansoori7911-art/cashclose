import { formatMoney } from '@cashclose/shared';

import type { StatusSummary } from '../hooks/useReports';

/**
 * کارت‌های وضعیت صندوق‌ها (بند ۱ سمت مالک).
 *
 * حالت‌هایی که نیاز به اقدام دارند (در انتظار بررسی، ردشده) رنگ
 * هشدار می‌گیرند، ولی متن هم کنارش هست — رنگ تنها حامل معنا نیست.
 */
const TILES = [
  { key: 'submitted', label: 'در انتظار بررسی', tone: 'warning' },
  { key: 'approved', label: 'تأییدشده', tone: 'balanced' },
  { key: 'rejected', label: 'ردشده', tone: 'shortage' },
  { key: 'draft', label: 'پیش‌نویس', tone: 'muted' },
] as const;

const TONE_CLASSES: Record<string, string> = {
  warning: 'text-warning',
  balanced: 'text-balanced',
  shortage: 'text-shortage',
  muted: 'text-text-muted',
};

export function StatusTiles({ data }: { data: StatusSummary }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TILES.map((tile) => {
        const item = data[tile.key];

        return (
          <div
            key={tile.key}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <dt className="text-xs text-text-muted">{tile.label}</dt>
            <dd className="mt-1">
              <span
                className={`text-2xl font-bold tabular-nums ${TONE_CLASSES[tile.tone]}`}
              >
                {item.count.toLocaleString('fa-IR')}
              </span>
              <span className="mr-1.5 text-xs text-text-muted">صندوق</span>
            </dd>
            {item.sales > 0 && (
              <p className="financial-figure mt-1 text-xs text-text-muted">
                {formatMoney(item.sales)} ریال
              </p>
            )}
          </div>
        );
      })}
    </dl>
  );
}
