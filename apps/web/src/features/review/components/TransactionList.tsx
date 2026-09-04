import { formatRial, getTransactionType } from '@cashclose/shared';

import { ImageUploader } from '../../../components/ui/ImageUploader/index';
import type { RegisterTransaction } from '../../cash-register/hooks/useRegisterApi';

/**
 * نمایش تراکنش‌های صندوق برای حسابدار — فقط خواندنی.
 *
 * تصاویر با همان کامپوننت آپلود نمایش داده می‌شوند ولی در حالت
 * `readOnly`، تا حسابدار بتواند مدارک را ببیند بدون اینکه بتواند
 * چیزی را حذف کند.
 */
export function TransactionList({
  transactions,
}: {
  transactions: RegisterTransaction[];
}) {
  const withValue = transactions.filter(
    (t) => t.amount > 0 || t.description || t.uploads.length > 0,
  );

  if (withValue.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-text-muted">
        این صندوق هیچ قلمی ثبت‌شده ندارد.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {withValue.map((transaction) => (
        <div
          key={transaction.id}
          className="rounded-lg border border-border bg-surface p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-text">
              {label(transaction.type)}
              {transaction.terminal && (
                <span className="mr-2 text-xs font-normal text-text-muted">
                  ({transaction.terminal.name}
                  {transaction.terminal.bank
                    ? ` — ${transaction.terminal.bank}`
                    : ''}
                  )
                </span>
              )}
            </span>

            <span className="tabular-nums text-sm font-semibold text-text">
              {formatRial(transaction.amount)}
            </span>
          </div>

          {transaction.description && (
            <p className="mt-1.5 text-sm text-text-muted">
              {transaction.description}
            </p>
          )}

          {transaction.uploads.length > 0 && (
            <div className="mt-2.5">
              <ImageUploader
                transactionId={transaction.id}
                images={transaction.uploads}
                readOnly
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function label(type: string): string {
  try {
    return getTransactionType(type as Parameters<typeof getTransactionType>[0])
      .label;
  } catch {
    return type;
  }
}
