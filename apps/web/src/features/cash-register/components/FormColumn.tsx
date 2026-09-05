import { getTransactionType, TransactionType } from '@cashclose/shared';

import type { FormRow } from '../hooks/useRegisterForm';
import { TerminalSummaryCard } from './TerminalSummaryCard';
import { TransactionRow } from './TransactionRow';

interface Props {
  title: string;
  hint: string;
  types: TransactionType[];
  rows: FormRow[];
  readOnly: boolean;
  onUpdate: (key: string, patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onAddRow: (type: TransactionType) => void;
  onRemoveRow: (key: string) => void;
  onOpenBreakdown: (type: TransactionType) => void;
}

/** یک ستون فرم صندوق — مانده صندوق یا جمع اسناد. */
export function FormColumn({
  title,
  hint,
  types,
  rows,
  readOnly,
  onUpdate,
  onAddRow,
  onRemoveRow,
  onOpenBreakdown,
}: Props) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between border-b-2 border-border pb-2">
        <h2 className="text-sm font-semibold text-text">
          {title}
          <span className="mr-2 text-xs font-normal text-text-muted">
            — {hint}
          </span>
        </h2>
      </div>

      <div className="flex flex-col gap-2.5">
        {types.map((type) => {
          const definition = getTransactionType(type);
          const typeRows = rows.filter((row) => row.type === type);

          // اقلام تفکیک‌شده به دستگاه فقط جمع را نشان می‌دهند؛ ریز آن‌ها
          // در مدال است تا ستون اصلی شلوغ نشود.
          if (definition.needsTerminal) {
            return (
              <TerminalSummaryCard
                key={type}
                rows={rows}
                type={type}
                onOpen={() => onOpenBreakdown(type)}
              />
            );
          }

          return (
            <div key={type} className="flex flex-col gap-2">
              {typeRows.map((row) => (
                <TransactionRow
                  key={row.key}
                  row={row}
                  disabled={readOnly}
                  onChange={(patch) => onUpdate(row.key, patch)}
                  onRemove={
                    // ردیف اول هر قلم حذف نمی‌شود تا فرم همیشه کامل بماند؛
                    // ردیف‌های اضافه (مثلاً چک دوم) قابل حذف‌اند.
                    typeRows.length > 1
                      ? () => onRemoveRow(row.key)
                      : undefined
                  }
                />
              ))}

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
        })}
      </div>
    </section>
  );
}
