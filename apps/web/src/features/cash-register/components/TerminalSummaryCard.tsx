import { formatMoney, type TransactionType } from '@cashclose/shared';

import type { FormRow } from '../hooks/useRegisterForm';
import { useTerminalRows } from '../hooks/useTerminalRows';

interface Props {
  rows: FormRow[];
  type: TransactionType;
  onOpen: () => void;
}

/**
 * کارت خلاصهٔ اقلام تفکیک‌شده به دستگاه.
 *
 * در ستون اصلی فقط جمع دیده می‌شود؛ کلیک روی کارت، ریز دستگاه‌ها را باز
 * می‌کند. این همان چیزی است که سند خواسته: فرم اصلی شلوغ نشود.
 */
export function TerminalSummaryCard({ rows, type, onOpen }: Props) {
  const { label, typeRows, total, duplicateTerminalIds, missingTerminalCount } =
    useTerminalRows(rows, type);

  const filled = typeRows.filter((row) => (row.amount ?? 0) > 0).length;
  const hasWarning = duplicateTerminalIds.size > 0 || missingTerminalCount > 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`ریز ${label} — ${filled} دستگاه، جمع ${formatMoney(total)} ریال`}
      className="w-full rounded-lg border border-border bg-surface p-3 text-right transition-colors hover:border-primary focus:border-primary focus:outline-none"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-text">{label}</span>
          <span className="mr-2 text-xs text-text-muted">
            {filled > 0 ? `${filled} دستگاه` : 'هنوز ثبت نشده'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="financial-figure text-sm font-semibold text-text">
            {formatMoney(total)}
          </span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="size-3.5 text-text-muted"
            aria-hidden
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
        </div>
      </div>

      {hasWarning && (
        // رنگ تنها حامل معنا نیست: متن هشدار هم کنارش می‌آید.
        <p className="mt-1.5 text-xs text-warning">
          {missingTerminalCount > 0
            ? `${missingTerminalCount} ردیف بدون دستگاه`
            : 'دستگاه تکراری'}
        </p>
      )}
    </button>
  );
}
