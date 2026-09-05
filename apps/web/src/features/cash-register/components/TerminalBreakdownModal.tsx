import { formatMoney, type TransactionType } from '@cashclose/shared';

import { Alert } from '../../../components/ui/Alert/index';
import { Modal } from '../../../components/ui/Modal/index';
import type { FormRow } from '../hooks/useRegisterForm';
import { useTerminalRows } from '../hooks/useTerminalRows';
import { TerminalRow } from './TerminalRow';

interface Props {
  open: boolean;
  onClose: () => void;
  rows: FormRow[];
  type: TransactionType;
  readOnly: boolean;
  onUpdate: (key: string, patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onAddRow: (type: TransactionType) => void;
  onRemoveRow: (key: string) => void;
}

/** ریز مبلغ هر دستگاه کارتخوان (بند ۹.۷ سند). */
export function TerminalBreakdownModal({
  open,
  onClose,
  rows,
  type,
  readOnly,
  onUpdate,
  onAddRow,
  onRemoveRow,
}: Props) {
  const {
    label,
    typeRows,
    total,
    options,
    isLoading,
    duplicateTerminalIds,
    missingTerminalCount,
  } = useTerminalRows(rows, type);

  return (
    <Modal open={open} onClose={onClose} title={`ریز ${label}`} size="wide">
      {isLoading && (
        <p className="text-sm text-text-muted">در حال خواندن دستگاه‌ها…</p>
      )}

      {!isLoading && options.length === 0 && (
        <Alert tone="warning" className="mb-4">
          برای شعبهٔ شما دستگاه فعالی تعریف نشده است. مبلغ را می‌توانید ثبت
          کنید، ولی تفکیک دستگاه ممکن نیست.
        </Alert>
      )}

      {missingTerminalCount > 0 && (
        <Alert tone="warning" className="mb-4">
          {missingTerminalCount} ردیف مبلغ دارد ولی دستگاهش انتخاب نشده است.
        </Alert>
      )}

      {duplicateTerminalIds.size > 0 && (
        <Alert tone="warning" className="mb-4">
          یک دستگاه در بیش از یک ردیف تکرار شده است. جمع درست می‌ماند، ولی
          گزارش تفکیکی دستگاه نادرست می‌شود.
        </Alert>
      )}

      <div className="flex flex-col gap-2.5">
        {typeRows.map((row) => (
          <TerminalRow
            key={row.key}
            row={row}
            options={options}
            readOnly={readOnly}
            duplicate={Boolean(
              row.terminalId && duplicateTerminalIds.has(row.terminalId),
            )}
            onChange={(patch) => onUpdate(row.key, patch)}
            onRemove={
              // ردیف آخر حذف نمی‌شود تا قلم همیشه در فرم بماند.
              typeRows.length > 1 ? () => onRemoveRow(row.key) : undefined
            }
          />
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => onAddRow(type)}
          className="mt-3 rounded px-2 py-1 text-xs text-primary transition-colors hover:bg-primary-soft"
        >
          + افزودن دستگاه
        </button>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5">
        <span className="text-sm text-text-muted">
          جمع {label} ({typeRows.length} ردیف)
        </span>
        <span className="financial-figure text-base font-semibold text-text">
          {formatMoney(total)} ریال
        </span>
      </div>
    </Modal>
  );
}
