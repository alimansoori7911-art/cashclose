import { getTransactionType } from '@cashclose/shared';

import { ImageUploader } from '../../../components/ui/ImageUploader/index';
import { NumberInput } from '../../../components/ui/NumberInput/index';
import type { FormRow } from '../hooks/useRegisterForm';

interface Props {
  row: FormRow;
  disabled?: boolean;
  onChange: (patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onRemove?: () => void;
}

/**
 * یک ردیف قلم در فرم صندوق.
 *
 * فیلد توضیح فقط برای اقلامی نمایش داده می‌شود که طبق جدول سند مجازند —
 * نمایش فیلد بی‌ربط، صندوقدار را سردرگم می‌کند.
 */
export function TransactionRow({ row, disabled, onChange, onRemove }: Props) {
  const definition = getTransactionType(row.type);

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <label
          className="flex-1 text-sm font-medium text-text"
          title={definition.hint}
        >
          {definition.label}
        </label>

        <div className="flex items-center gap-2">
          <NumberInput
            value={row.amount}
            onChange={(amount) => onChange({ amount })}
            disabled={disabled}
            className="w-44"
          />
          {onRemove && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`حذف ردیف ${definition.label}`}
              className="grid size-8 shrink-0 place-items-center rounded border border-border text-text-muted transition-colors hover:border-shortage hover:text-shortage"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="size-3.5"
                aria-hidden
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {definition.hasDescription && (
        <input
          type="text"
          value={row.description}
          disabled={disabled}
          maxLength={300}
          placeholder="توضیح (اختیاری)"
          onChange={(event) => onChange({ description: event.target.value })}
          aria-label={`توضیح ${definition.label}`}
          className="mt-2 w-full rounded border border-border bg-bg px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none disabled:bg-surface-muted"
        />
      )}

      {definition.hasImages && (
        <div className="mt-2">
          {row.id ? (
            <ImageUploader
              transactionId={row.id}
              images={row.images}
              readOnly={disabled}
              label={`تصاویر ${definition.label}`}
            />
          ) : (
            // پیش از اولین ذخیره، تراکنش هنوز شناسه ندارد و تصویر جایی
            // برای پیوست‌شدن پیدا نمی‌کند.
            <p className="text-xs text-text-muted">
              برای افزودن تصویر، ابتدا مبلغ را وارد و ذخیره کنید.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
