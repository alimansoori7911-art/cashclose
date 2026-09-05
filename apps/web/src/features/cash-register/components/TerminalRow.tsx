import { getTransactionType } from '@cashclose/shared';

import { ImageUploader } from '../../../components/ui/ImageUploader/index';
import { NumberInput } from '../../../components/ui/NumberInput/index';
import type { SelectOption } from '../../../components/ui/SelectInput/index';
import type { FormRow } from '../hooks/useRegisterForm';

interface Props {
  row: FormRow;
  options: SelectOption[];
  readOnly: boolean;
  duplicate: boolean;
  onChange: (patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onRemove?: () => void;
}

/**
 * یک دستگاه در مدال تفکیک.
 *
 * برخلاف `TransactionRow`، اینجا انتخاب دستگاه در کنار مبلغ می‌آید چون
 * هویت ردیف همان دستگاه است، نه نوع قلم.
 */
export function TerminalRow({
  row,
  options,
  readOnly,
  duplicate,
  onChange,
  onRemove,
}: Props) {
  const definition = getTransactionType(row.type);

  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={row.terminalId ?? ''}
          disabled={readOnly}
          aria-label="دستگاه"
          aria-invalid={duplicate || undefined}
          onChange={(event) =>
            onChange({ terminalId: event.target.value || null })
          }
          className={[
            'min-w-44 flex-1 rounded border bg-surface px-3 py-2 text-sm text-text',
            'transition-colors focus:outline-none disabled:bg-surface-muted',
            duplicate
              ? 'border-warning focus:border-warning'
              : 'border-border focus:border-primary',
          ].join(' ')}
        >
          <option value="">— انتخاب دستگاه —</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <NumberInput
          value={row.amount}
          onChange={(amount) => onChange({ amount })}
          disabled={readOnly}
          className="w-44"
        />

        {onRemove && !readOnly && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="حذف این دستگاه"
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

      {duplicate && (
        <p className="mt-1.5 text-xs text-warning">
          این دستگاه در ردیف دیگری هم انتخاب شده است.
        </p>
      )}

      {definition.hasDescription && (
        <input
          type="text"
          value={row.description}
          disabled={readOnly}
          maxLength={300}
          placeholder="توضیح (اختیاری)"
          onChange={(event) => onChange({ description: event.target.value })}
          aria-label="توضیح دستگاه"
          className="mt-2 w-full rounded border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none disabled:bg-surface-muted"
        />
      )}

      {definition.hasImages && row.id && (
        <div className="mt-2">
          <ImageUploader
            transactionId={row.id}
            images={row.images}
            readOnly={readOnly}
            label="رسید پایان روز"
          />
        </div>
      )}
    </div>
  );
}
