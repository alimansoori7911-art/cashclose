import {
  FormulaSide,
  getTransactionType,
  getTypesBySide,
  TransactionType,
} from '@cashclose/shared';
import { useMemo } from 'react';

import type { FormRow } from '../hooks/useRegisterForm';
import { TransactionRow } from './TransactionRow';

interface Props {
  rows: FormRow[];
  readOnly: boolean;
  onUpdate: (
    key: string,
    patch: Partial<Omit<FormRow, 'key' | 'type'>>,
  ) => void;
  onAddRow: (type: TransactionType) => void;
  onRemoveRow: (key: string) => void;
}

/**
 * فرم دوستونی صندوق.
 *
 * چیدمان عمداً آینهٔ فایل اکسلی است که صندوقدار سال‌ها با آن کار کرده:
 * راست = اقلام مانده صندوق (از حسابداری)، چپ = جمع اسناد (پول واقعی).
 */
export function RegisterForm({
  rows,
  readOnly,
  onUpdate,
  onAddRow,
  onRemoveRow,
}: Props) {
  const balanceTypes = useMemo(
    () => [
      ...getTypesBySide(FormulaSide.BALANCE_ADD),
      ...getTypesBySide(FormulaSide.BALANCE_SUBTRACT),
    ],
    [],
  );
  const documentTypes = useMemo(
    () => getTypesBySide(FormulaSide.DOCUMENT),
    [],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Column
        title="مانده صندوق"
        hint="محاسبه از سیستم حسابداری"
        types={balanceTypes.map((d) => d.type)}
        rows={rows}
        readOnly={readOnly}
        onUpdate={onUpdate}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />
      <Column
        title="جمع اسناد"
        hint="پول و اسناد واقعی صندوق"
        types={documentTypes.map((d) => d.type)}
        rows={rows}
        readOnly={readOnly}
        onUpdate={onUpdate}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />
    </div>
  );
}

function Column({
  title,
  hint,
  types,
  rows,
  readOnly,
  onUpdate,
  onAddRow,
  onRemoveRow,
}: {
  title: string;
  hint: string;
  types: TransactionType[];
} & Omit<Props, 'rows'> & { rows: FormRow[] }) {
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
          const typeRows = rows.filter((row) => row.type === type);

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

              {!readOnly && isMultiRow(type) && (
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

/** آیا این قلم چند ردیفی است؟ (چک، کارتخوان، …) */
function isMultiRow(type: TransactionType): boolean {
  return getTransactionType(type).isMultiRow;
}
