import type { CashRegisterStatus } from '@cashclose/shared';
import { useState } from 'react';

import { AppLayout } from '../components/layout/AppLayout';
import { NoRegisterState } from '../features/cash-register/components/NoRegisterState';
import { RegisterForm } from '../features/cash-register/components/RegisterForm';
import { RegisterHeader } from '../features/cash-register/components/RegisterHeader';
import { SummaryBar } from '../features/cash-register/components/SummaryBar';
import {
  useAutoSave,
  useUnsavedWarning,
} from '../features/cash-register/hooks/useAutoSave';
import { useDraftSaver } from '../features/cash-register/hooks/useDraftSaver';
import { useLoadedRegisterForm } from '../features/cash-register/hooks/useLoadedRegisterForm';
import {
  useCloseRegister,
  useCreateRegister,
  useCurrentRegister,
  useRegisterDetail,
} from '../features/cash-register/hooks/useRegisterApi';
import { ApiError } from '../lib/api';

/** صفحهٔ ثبت و بستن صندوق روزانه. */
export function CashRegisterPage() {
  const current = useCurrentRegister();
  const createRegister = useCreateRegister();
  const registerId = current.data?.id;

  const detail = useRegisterDetail(registerId);
  const closeRegister = useCloseRegister(registerId);
  const form = useLoadedRegisterForm(detail.data);
  const draft = useDraftSaver(registerId, form);

  const [createError, setCreateError] = useState<string | null>(null);

  const status = current.data?.status;
  const readOnly = status === 'submitted' || status === 'approved';

  // پاسخ خالی سرور (صندوق باز وجود ندارد) به‌صورت شیء بدون فیلد می‌رسد،
  // پس هر دو حلقه باید اختیاری باشند نه فقط `data`.
  const businessDate = current.data?.businessDate?.slice(0, 10) ?? '';
  const coversUntil = current.data?.coversUntilDate?.slice(0, 10) ?? null;

  useAutoSave({
    enabled: Boolean(registerId) && !readOnly,
    isDirty: form.isDirty,
    // خطای ذخیرهٔ خودکار در state ثبت می‌شود؛ اینجا فقط نباید unhandled بماند.
    onSave: () => void draft.saveDraft().catch(() => undefined),
  });
  useUnsavedWarning(form.isDirty && !readOnly);

  async function handleClose() {
    try {
      // پیش از بستن، آخرین تغییرات ذخیره می‌شود تا سرور روی دادهٔ کامل
      // تصمیم بگیرد.
      await draft.saveDraft();
      const result = await closeRegister.mutateAsync();
      draft.setNotice(result.message);
    } catch (err) {
      draft.setError(
        err instanceof ApiError ? err.displayMessage : 'بستن صندوق ناموفق بود.',
      );
    }
  }

  if (current.isPending) {
    return (
      <AppLayout>
        <p className="text-text-muted">در حال بارگذاری…</p>
      </AppLayout>
    );
  }

  if (!current.data) {
    return (
      <AppLayout>
        <NoRegisterState
          creating={createRegister.isPending}
          error={createError}
          onCreate={async (options) => {
            setCreateError(null);
            try {
              await createRegister.mutateAsync(options);
            } catch (err) {
              setCreateError(
                err instanceof ApiError
                  ? err.displayMessage
                  : 'ایجاد صندوق ناموفق بود.',
              );
            }
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <RegisterHeader
        businessDate={businessDate}
        coversUntil={coversUntil}
        branchName={current.data.branch.name}
        status={status as CashRegisterStatus}
        readOnly={readOnly}
        error={draft.error}
        notice={draft.notice}
      />

      <RegisterForm
        rows={form.rows}
        readOnly={readOnly}
        onUpdate={form.update}
        onAddRow={form.addRow}
        onRemoveRow={form.removeRow}
      />

      <div className="h-6" />

      <SummaryBar
        calculation={form.calculation}
        readOnly={readOnly}
        saving={draft.saving}
        closing={closeRegister.isPending}
        onSaveDraft={() => void draft.saveDraft().catch(() => undefined)}
        onClose={handleClose}
      />
    </AppLayout>
  );
}
