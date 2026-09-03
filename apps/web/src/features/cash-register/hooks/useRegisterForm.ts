import {
  calculateCashRegister,
  TransactionType,
  type CashCalculationResult,
} from '@cashclose/shared';
import { useCallback, useMemo, useState } from 'react';

import {
  assignSavedIds,
  rowsToPayload,
  type SavedTransaction,
} from './row-identity';

/**
 * وضعیت فرم صندوق و محاسبهٔ زندهٔ اختلاف.
 *
 * نکتهٔ مهم: همان موتور محاسبهٔ بک‌اند اینجا اجرا می‌شود (از بستهٔ
 * `shared`)، پس عددی که صندوقدار حین تایپ می‌بیند دقیقاً همانی است که
 * سرور هنگام بستن صندوق بررسی می‌کند.
 */

/** یک تصویر پیوست‌شده به ردیف. */
export interface RowImage {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** یک ردیف در فرم؛ `key` فقط برای React است و به سرور نمی‌رود. */
export interface FormRow {
  key: string;
  /** شناسهٔ رکورد در دیتابیس؛ تا اولین ذخیره `null` است. */
  id: string | null;
  type: TransactionType;
  amount: number | null;
  description: string;
  terminalId: string | null;
  images: RowImage[];
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
    id: null,
    type,
    amount: null,
    description: '',
    terminalId: null,
    images: [],
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

  /**
   * نشاندن شناسه‌های بازگشتی از سرور روی ردیف‌ها.
   *
   * ردیفی که تازه ساخته شده تا پیش از این شناسه نداشت و نمی‌شد به آن
   * تصویر پیوست کرد. تطبیق بر اساس نوع و ترتیب انجام می‌شود، چون همان
   * چیزی است که سرور هم بر اساسش مرتب می‌کند.
   */
  const applySavedIds = useCallback((saved: SavedTransaction[]) => {
    setRows((current) => assignSavedIds(current, saved));
  }, []);

  /** نتیجهٔ محاسبه — با هر تغییر ردیف‌ها دوباره حساب می‌شود. */
  const calculation: CashCalculationResult = useMemo(
    () =>
      calculateCashRegister(
        rows.map((row) => ({ type: row.type, amount: row.amount ?? 0 })),
      ),
    [rows],
  );

  /** ردیف‌های آمادهٔ ارسال به سرور. */
  const toPayload = useCallback(() => rowsToPayload(rows), [rows]);

  return {
    rows,
    calculation,
    isDirty,
    setDirty,
    update,
    addRow,
    removeRow,
    replaceAll,
    applySavedIds,
    toPayload,
  };
}
