import { getTransactionType } from '@cashclose/shared';

import { Alert } from '../../../components/ui/Alert/index';
import type {
  TransactionDiff,
  VersionComparison,
} from '../hooks/useReviewApi';
import { amountText, DiffTotals } from './DiffTotals';

/**
 * نمایش تفاوت دو نسخهٔ صندوق (بند AC9 سند).
 *
 * ردیف‌های تغییرکرده رنگی می‌شوند و مقدار قبل و بعد کنار هم می‌آید تا
 * حسابدار در یک نگاه ببیند صندوقدار چه چیزی را اصلاح کرده است.
 */

const KIND_STYLES: Record<
  TransactionDiff['kind'],
  { row: string; label: string; badge: string }
> = {
  changed: {
    row: 'bg-warning-soft/40',
    label: 'تغییر کرد',
    badge: 'text-warning',
  },
  added: {
    row: 'bg-balanced-soft/40',
    label: 'افزوده شد',
    badge: 'text-balanced',
  },
  removed: {
    row: 'bg-shortage-soft/40',
    label: 'حذف شد',
    badge: 'text-shortage',
  },
  unchanged: { row: '', label: '—', badge: 'text-text-muted' },
};

function label(type: string): string {
  try {
    return getTransactionType(type as Parameters<typeof getTransactionType>[0])
      .label;
  } catch {
    // نوع ناشناخته نباید کل صفحه را بشکند.
    return type;
  }
}

export function VersionDiff({ data }: { data: VersionComparison }) {
  const { from, to, diff } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-text-muted">
          مقایسهٔ نسخهٔ{' '}
          <span className="font-medium text-text">
            {from.versionNumber.toLocaleString('fa-IR')}
          </span>{' '}
          با نسخهٔ{' '}
          <span className="font-medium text-text">
            {to.versionNumber.toLocaleString('fa-IR')}
          </span>
        </p>

        {diff.changedCount === 0 ? (
          <Alert tone="info">هیچ تفاوتی بین این دو نسخه وجود ندارد.</Alert>
        ) : (
          <span className="text-warning">
            {diff.changedCount.toLocaleString('fa-IR')} تغییر
          </span>
        )}
      </div>

      <DiffTotals totals={diff.totals} />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-text-muted">
              <th className="px-4 py-2.5 text-right font-medium">قلم</th>
              <th className="px-4 py-2.5 text-right font-medium">
                نسخهٔ {from.versionNumber.toLocaleString('fa-IR')}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                نسخهٔ {to.versionNumber.toLocaleString('fa-IR')}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {diff.transactions.map((row) => {
              const style = KIND_STYLES[row.kind];

              return (
                <tr
                  key={row.type}
                  className={`border-b border-border last:border-0 ${style.row}`}
                >
                  <td className="px-4 py-2.5 text-text">{label(row.type)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-text">
                    {amountText(row.before?.amount)}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-text">
                    {amountText(row.after?.amount)}
                  </td>
                  <td className={`px-4 py-2.5 ${style.badge}`}>
                    {style.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
