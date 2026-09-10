import { findMissingRequired, needsExplanation } from '@cashclose/shared';
import { useMemo } from 'react';

import type { FormRow } from './useRegisterForm';

/**
 * اقلام اجباریِ ناقص در فرم.
 *
 * از همان تابع بستهٔ مشترک استفاده می‌کند که سرور هم می‌شناسد، پس
 * چیزی که صندوقدار روی صفحه می‌بیند با تصمیم سرور یکی است.
 */
export function useCompleteness(rows: FormRow[]) {
  const missing = useMemo(
    () =>
      findMissingRequired(
        rows.map((row) => ({
          type: row.type,
          amount: row.amount ?? 0,
          description: row.description,
          imageCount: row.images.length,
        })),
      ),
    [rows],
  );

  return {
    missing,
    /** بستن صندوق نیازمند گرفتن دلیل است؟ */
    needsExplanation: needsExplanation(missing),
    hasAny: missing.length > 0,
  };
}

/** کلید ردیفِ متناظر با یک قلم ناقص — برای نوشتن دلیل روی همان ردیف. */
export function findRowKey(rows: FormRow[], type: string): string | null {
  const match = rows.find(
    (row) => row.type === type && (row.amount ?? 0) > 0,
  );

  return match?.key ?? null;
}
