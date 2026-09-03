import {
  calculateCashRegister,
  TransactionType,
  type CashCalculationResult,
} from '@cashclose/shared';
import { useCallback, useMemo, useState } from 'react';

/**
 * وضعیت فرم صندوق و محاسبهٔ زندهٔ اختلاف.
 *
 * نکتهٔ مهم: همان موتور محاسبهٔ بک‌اند اینجا اجرا می‌شود (از بستهٔ
 * `shared`)، پس عددی که صندوقدار حین تایپ می‌بیند دقیقاً همانی است که
 * سرور هنگام بستن صندوق بررسی می‌کند.
 */

/** یک ردیف در فرم؛ `key` فقط برای React است و به سرور نمی‌رود. */
export interface FormRow {
  key: string;
  type: TransactionType;
  amount: number | null;
  description: string;
  terminalId: string | null;
}

let rowCounter = 0;
function nextKey(): string {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

export function createRow(
  type: TransactionType,
  overrides: Partial<FormRow> = {},
): FormRow {
  return {
    key: nextKey(),
    type,
    amount: null,
    description: '',
    terminalId: null,
    ...overrides,
  };
}

export function useRegisterForm(initialRows: FormRow[] = []) {
  const [rows, setRows] = useState<FormRow[]>(initialRows);
  const [isDirty, setDirty] = useState(false);

  const update = useCallback(
    (key: string, patch: Partial<Omit<FormRow, 'key' | 'type'>>) => {
      setRows((current) =>
        current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
      );
      setDirty(true);
    },
    [],
  );

  const addRow = useCallback((type: TransactionType) => {
    setRows((current) => [...current, createRow(type)]);
    setDirty(true);
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((current) => current.filter((row) => row.key !== key));
    setDirty(true);
  }, []);

  const replaceAll = useCallback((next: FormRow[]) => {
    setRows(next);
    setDirty(false);
  }, []);

  /** نتیجهٔ محاسبه — با هر تغییر ردیف‌ها دوباره حساب می‌شود. */
  const calculation: CashCalculationResult = useMemo(
    () =>
      calculateCashRegister(
        rows.map((row) => ({ type: row.type, amount: row.amount ?? 0 })),
      ),
    [rows],
  );

  /** ردیف‌های آمادهٔ ارسال — ردیف‌های کاملاً خالی حذف می‌شوند. */
  const toPayload = useCallback(
    () =>
      rows
        .filter((row) => row.amount !== null || row.description.trim() !== '')
        .map((row, index) => ({
          type: row.type,
          amount: row.amount ?? 0,
          ...(row.description.trim()
            ? { description: row.description.trim() }
            : {}),
          ...(row.terminalId ? { terminalId: row.terminalId } : {}),
          sortOrder: index,
        })),
    [rows],
  );

  return {
    rows,
    calculation,
    isDirty,
    setDirty,
    update,
    addRow,
    removeRow,
    replaceAll,
    toPayload,
  };
}
