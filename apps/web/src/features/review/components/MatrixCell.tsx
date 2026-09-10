import { formatMoney } from '@cashclose/shared';

import type { MatrixCell as Cell } from '../hooks/useMatrix';

interface Props {
  cell: Cell | undefined;
  onOpenImages: () => void;
}

/**
 * یک خانهٔ جدول حسابدار (بند ۹ سند).
 *
 * سه حالت دارد:
 *   • خالی — آن قلم در این صندوق ثبت نشده
 *   • فقط عدد
 *   • عدد به‌همراه توضیح یا تصویر
 *
 * توضیح با `title` به‌صورت hint می‌آید و تصویر با کلیک باز می‌شود —
 * دقیقاً همان چیزی که سند خواسته.
 */
export function MatrixCellView({ cell, onOpenImages }: Props) {
  if (!cell || cell.amount === '0') {
    return <span className="text-text-muted">—</span>;
  }

  const hint = cell.descriptions.join('\n');
  const hasImages = cell.images.length > 0;

  const amount = (
    <span className="financial-figure text-sm text-text">
      {formatMoney(Number(cell.amount))}
    </span>
  );

  return (
    <div
      className="flex items-center justify-end gap-1.5"
      // hint فقط وقتی معنا دارد که توضیحی باشد؛ عنوان خالی روی همهٔ
      // خانه‌ها فقط مزاحمت است.
      title={hint || undefined}
    >
      {hasImages ? (
        <button
          type="button"
          onClick={onOpenImages}
          aria-label={`نمایش ${cell.images.length.toLocaleString('fa-IR')} تصویر`}
          className="flex items-center gap-1 rounded px-1 py-0.5 text-primary transition-colors hover:bg-primary-soft"
        >
          {amount}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            className="size-3.5 shrink-0"
            aria-hidden
          >
            <rect x="2" y="3" width="12" height="10" rx="1.5" />
            <circle cx="6" cy="6.5" r="1" />
            <path d="M2 11l3.5-3 2.5 2 2-1.5L14 11" />
          </svg>
        </button>
      ) : (
        amount
      )}

      {/* نشان توضیح — رنگ تنها حامل معنا نیست، برچسب دسترسی هم دارد. */}
      {hint && (
        <span
          aria-label="این قلم توضیح دارد"
          className="text-xs text-text-muted"
        >
          ✎
        </span>
      )}
    </div>
  );
}
