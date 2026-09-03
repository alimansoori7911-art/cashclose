import { useCallback, useRef, useState } from 'react';

import { api, ApiError } from '../../../lib/api';
import type { useRegisterForm } from './useRegisterForm';

/**
 * ذخیرهٔ پیش‌نویس.
 *
 * ذخیره‌های هم‌زمان مهار می‌شوند: اگر ذخیرهٔ خودکار و کلیک دستی با هم
 * برسند، دومی نادیده گرفته می‌شود تا دو درخواست موازی، ترتیب داده را
 * به‌هم نریزند.
 */
export function useDraftSaver(
  registerId: string | undefined,
  form: ReturnType<typeof useRegisterForm>,
) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(false);

  const saveDraft = useCallback(async () => {
    if (!registerId || inFlight.current) return;

    inFlight.current = true;
    setSaving(true);
    setError(null);

    try {
      const result = await api.patch<{
        transactions: { id: string; type: string; sortOrder: number }[];
      }>(`/cash-registers/${registerId}/draft`, {
        transactions: form.toPayload(),
      });

      // شناسهٔ ردیف‌های تازه‌ساخته‌شده برمی‌گردد تا بتوان به آن‌ها تصویر
      // پیوست کرد.
      form.applySavedIds(result.transactions);
      form.setDirty(false);
      setNotice('پیش‌نویس ذخیره شد.');
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'ذخیره ناموفق بود. اتصال خود را بررسی کنید.',
      );
      // خطا نباید بی‌صدا بماند؛ فراخوان تصمیم می‌گیرد چه کند.
      throw err;
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, [registerId, form]);

  return { saveDraft, saving, error, setError, notice, setNotice };
}
