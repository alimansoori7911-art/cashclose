import { useState } from 'react';

import { ApiError } from '../../../lib/api';
import { useCompleteness } from './useCompleteness';
import type { useDraftSaver } from './useDraftSaver';
import type { FormRow } from './useRegisterForm';

/**
 * فلوی بستن صندوق.
 *
 * دو مرحله دارد چون نبودِ قلم اجباری نباید بستن را **مسدود** کند، فقط
 * باید دلیل بخواهد: کلیک اول مدال را باز می‌کند، تأیید داخل مدال واقعاً
 * می‌بندد.
 */
export function useCloseFlow({
  rows,
  draft,
  closeRegister,
}: {
  rows: FormRow[];
  draft: ReturnType<typeof useDraftSaver>;
  closeRegister: {
    mutateAsync: () => Promise<{ message: string }>;
    isPending: boolean;
  };
}) {
  const [showModal, setShowModal] = useState(false);
  const completeness = useCompleteness(rows);

  /** بستن واقعی — پس از عبور از بررسی اقلام اجباری. */
  async function performClose(): Promise<void> {
    try {
      // پیش از بستن، آخرین تغییرات ذخیره می‌شود تا سرور روی دادهٔ کامل
      // تصمیم بگیرد.
      await draft.saveDraft();
      const result = await closeRegister.mutateAsync();
      setShowModal(false);
      draft.setNotice(result.message);
    } catch (err) {
      draft.setError(
        err instanceof ApiError ? err.displayMessage : 'بستن صندوق ناموفق بود.',
      );
    }
  }

  function requestClose(): void {
    if (completeness.hasAny) {
      setShowModal(true);
      return;
    }

    void performClose();
  }

  return {
    completeness,
    showModal,
    closeModal: () => setShowModal(false),
    requestClose,
    performClose: () => void performClose(),
    closing: closeRegister.isPending || draft.saving,
  };
}
