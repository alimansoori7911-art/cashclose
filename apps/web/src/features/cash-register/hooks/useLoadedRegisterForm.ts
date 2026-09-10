import { TRANSACTION_TYPES } from '@cashclose/shared';
import { useEffect, useRef } from 'react';

import type { RegisterDetail } from './useRegisterApi';
import { createRow, useRegisterForm, type FormRow } from './useRegisterForm';

/** یک ردیف خالی برای هر قلم — فرم همیشه کامل شروع می‌شود. */
export function buildEmptyRows(): FormRow[] {
  return TRANSACTION_TYPES.map((def) => createRow(def.type));
}

/**
 * فرم صندوق، پرشده از دادهٔ ذخیره‌شده.
 *
 * بارگذاری فقط **یک‌بار** برای هر صندوق انجام می‌شود: بدون این محافظ،
 * هر بار که React Query دوباره واکشی کند، ورودی‌های نیمه‌تایپ‌شدهٔ
 * صندوقدار با مقدار سرور بازنویسی می‌شدند.
 */
export function useLoadedRegisterForm(detail: RegisterDetail | undefined) {
  const form = useRegisterForm(buildEmptyRows());
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!detail || loadedFor.current === detail.id) return;
    loadedFor.current = detail.id;

    const saved = detail.transactions.map((t) =>
      createRow(t.type as FormRow['type'], {
        id: t.id,
        amount: t.amount,
        description: t.description ?? '',
        terminalId: t.terminalId,
        images: t.uploads ?? [],
      }),
    );

    // اقلامی که هنوز ردیفی ندارند، یک ردیف خالی می‌گیرند.
    const missing = TRANSACTION_TYPES.filter(
      (def) => !saved.some((row) => row.type === def.type),
    ).map((def) => createRow(def.type));

    form.replaceAll([...saved, ...missing]);
  }, [detail, form]);

  /**
   * تصاویر با هر واکشی تازه می‌شوند، برخلاف بقیهٔ فیلدها.
   *
   * آپلود و حذف تصویر مستقیم روی سرور انجام می‌شود، پس تنها منبع درست
   * همان پاسخ سرور است. اگر مثل بقیهٔ فیلدها فقط یک‌بار خوانده می‌شد،
   * عکس تازه‌آپلودشده هرگز روی فرم نمی‌نشست.
   */
  useEffect(() => {
    if (!detail) return;

    const byRowId = new Map(
      detail.transactions.map((t) => [t.id, t.uploads ?? []]),
    );

    form.syncImages(byRowId);
  }, [detail, form]);

  return form;
}
