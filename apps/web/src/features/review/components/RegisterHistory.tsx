import {
  CASH_REGISTER_STATUS_LABELS,
  formatJalali,
  type CashRegisterStatus,
} from '@cashclose/shared';

interface HistoryEntry {
  id: string;
  status: string;
  comment: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string } | null;
}

/**
 * تاریخچهٔ تغییر وضعیت صندوق (بند ۱۱.۲ قاعدهٔ ۳).
 *
 * هر تغییر وضعیت یک رکورد دارد و علت رد اینجا برای همیشه می‌ماند —
 * حتی پس از اصلاح و تأیید مجدد.
 */
export function RegisterHistory({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-text-muted">
        تاریخچه‌ای ثبت نشده است.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2.5">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="rounded-lg border border-border bg-surface p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-text">
              {CASH_REGISTER_STATUS_LABELS[
                entry.status as CashRegisterStatus
              ] ?? entry.status}
            </span>

            <span className="text-xs text-text-muted">
              {formatJalali(entry.createdAt.slice(0, 10))} —{' '}
              {new Date(entry.createdAt).toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {entry.createdBy && (
            <p className="mt-1 text-xs text-text-muted">
              توسط {entry.createdBy.fullName}
            </p>
          )}

          {entry.comment && (
            <p className="mt-2 rounded bg-surface-muted px-3 py-2 text-sm text-text">
              {entry.comment}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
