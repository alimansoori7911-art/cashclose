import { getTransactionType, TransactionType } from '@cashclose/shared';
import { useMemo } from 'react';

import { useTerminals } from '../../admin/hooks/useAdminData';
import type { FormRow } from './useRegisterForm';

/**
 * منطق تفکیک مبلغ به تفکیک دستگاه.
 *
 * کارت روی فرم فقط **جمع** را نشان می‌دهد و ریز دستگاه‌ها داخل مدال است:
 * فروشگاه چند کارتخوان دارد و نمایش همهٔ ردیف‌ها در ستون اصلی، فرم را
 * شلوغ می‌کند بی‌آنکه چیزی به تراز اضافه کند.
 */
export function useTerminalRows(rows: FormRow[], type: TransactionType) {
  const { data: terminals, isLoading } = useTerminals();

  const typeRows = useMemo(
    () => rows.filter((row) => row.type === type),
    [rows, type],
  );

  const total = useMemo(
    () => typeRows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    [typeRows],
  );

  /** فقط دستگاه‌های فعال؛ دستگاه غیرفعال دیگر رسید پایان روز ندارد. */
  const options = useMemo(
    () =>
      (terminals ?? [])
        .filter((terminal) => terminal.isActive)
        .map((terminal) => ({
          value: terminal.id,
          label: terminal.bank
            ? `${terminal.name} — ${terminal.bank}`
            : terminal.name,
        })),
    [terminals],
  );

  /**
   * دستگاهی که در بیش از یک ردیف تکرار شده است.
   *
   * جمع درست می‌ماند، ولی گزارش «کدام دستگاه چقدر» بی‌معنا می‌شود؛ پس
   * هشدار داده می‌شود بدون آنکه جلوی ذخیره گرفته شود.
   */
  const duplicateTerminalIds = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const row of typeRows) {
      if (!row.terminalId) continue;
      if (seen.has(row.terminalId)) duplicates.add(row.terminalId);
      seen.add(row.terminalId);
    }

    return duplicates;
  }, [typeRows]);

  /** ردیفی که مبلغ دارد ولی دستگاهش انتخاب نشده است. */
  const missingTerminalCount = useMemo(
    () =>
      typeRows.filter((row) => (row.amount ?? 0) > 0 && !row.terminalId).length,
    [typeRows],
  );

  return {
    label: getTransactionType(type).label,
    typeRows,
    total,
    options,
    isLoading,
    duplicateTerminalIds,
    missingTerminalCount,
  };
}
