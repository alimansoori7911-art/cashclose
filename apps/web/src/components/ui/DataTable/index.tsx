import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * جدول داده با پوشش کامل حالت‌ها.
 *
 * چهار حالت سند (خالی، در حال بارگذاری، خطا، موفق) اینجا یک‌جا مدیریت
 * می‌شوند تا در هر صفحه دوباره نوشته نشوند و رفتارشان یکسان بماند.
 */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /**
   * ستون عددی: عرض ثابت ارقام می‌گیرد تا ستون‌ها در هم نریزند.
   *
   * چیدمان همچنان راست‌چین می‌ماند — در جدول RTL، چپ‌چین‌کردن عدد آن را
   * به لبهٔ ستون مجاور می‌چسباند و خواننده آن را زیر سرتیتر اشتباه
   * می‌بیند.
   */
  numeric?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  emptyMessage = 'موردی یافت نشد.',
  onRetry,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="mb-3 text-sm text-shortage">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded border border-border px-3 py-1.5 text-sm text-text hover:bg-surface-muted"
          >
            تلاش دوباره
          </button>
        )}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    // جدول در ظرف خودش اسکرول افقی می‌گیرد تا بدنهٔ صفحه هرگز
    // به‌صورت افقی اسکرول نشود.
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={clsx(
                  'px-4 py-3 text-right font-medium text-text-muted',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border last:border-0 hover:bg-surface-muted/50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-text',
                    col.numeric && 'tabular-nums',
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-surface"
      aria-busy="true"
      aria-label="در حال بارگذاری"
    >
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b border-border px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: columns }).map((__, colIndex) => (
            <div
              key={colIndex}
              className="h-4 flex-1 animate-pulse rounded bg-surface-muted"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
