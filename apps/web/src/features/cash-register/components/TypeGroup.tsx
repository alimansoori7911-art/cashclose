import {
  formatMoney,
  getTransactionType,
  type TransactionType,
} from '@cashclose/shared';

import type { FormRow } from '../hooks/useRegisterForm';
import { TerminalSummaryCard } from './TerminalSummaryCard';
import { TransactionRow } from './TransactionRow';

interface Props {
  type: TransactionType;
  rows: FormRow[];
  readOnly: boolean;
  /** مبلغ همین قلم در صندوق قبلی — برای مقایسه. */
  previousAmount?: number;
  onUpdate: (key: string, patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onAddRow: (type: TransactionType) => void;
  onRemoveRow: (key: string) => void;
  onOpenBreakdown: (type: TransactionType) => void;
}

/** همهٔ ردیف‌های یک قلم، به‌همراه دکمهٔ افزودن ردیف تازه. */
export function TypeGroup({
  type,
  rows,
  readOnly,
  previousAmount,
  onUpdate,
  onAddRow,
  onRemoveRow,
  onOpenBreakdown,
}: Props) {
  const definition = getTransactionType(type);
  const typeRows = rows.filter((row) => row.type === type);

  // اقلام تفکیک‌شده به دستگاه فقط جمع را نشان می‌دهند؛ ریز آن‌ها در مدال
  // است تا ستون اصلی شلوغ نشود.
  if (definition.needsTerminal) {
    return (
      <TerminalSummaryCard
        rows={rows}
        type={type}
        onOpen={() => onOpenBreakdown(type)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {typeRows.map((row) => (
        <TransactionRow
          key={row.key}
          row={row}
          disabled={readOnly}
          onChange={(patch) => onUpdate(row.key, patch)}
          onRemove={
            // ردیف اول هر قلم حذف نمی‌شود تا فرم همیشه کامل بماند؛
            // ردیف‌های اضافه (مثلاً چک دوم) قابل حذف‌اند.
            typeRows.length > 1 ? () => onRemoveRow(row.key) : undefined
          }
        />
      ))}

      {/* مقایسه با صندوق قبلی — واقعیت ثبت‌شده، نه پیش‌بینی. کمک می‌کند
          صندوقدار قلم جامانده را زودتر ببیند. */}
      {previousAmount !== undefined && previousAmount > 0 && (
        <p className="text-xs text-text-muted">
          صندوق قبلی:{' '}
          <span className="financial-figure">
            {formatMoney(previousAmount)}
          </span>
        </p>
      )}

      {!readOnly && definition.isMultiRow && (
        <button
          type="button"
          onClick={() => onAddRow(type)}
          className="self-start rounded px-2 py-1 text-xs text-primary transition-colors hover:bg-primary-soft"
        >
          + افزودن ردیف
        </button>
      )}
    </div>
  );
}
