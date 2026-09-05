import {
  formatJalaliLong,
  type CashRegisterStatus,
} from '@cashclose/shared';
import { useState } from 'react';

import { AppLayout } from '../components/layout/AppLayout';
import { Alert } from '../components/ui/Alert/index';
import { RegisterStatusBadge } from '../components/ui/StatusBadge/index';
import { NoRegisterState } from '../features/cash-register/components/NoRegisterState';
import { RegisterForm } from '../features/cash-register/components/RegisterForm';
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
        err instanceof ApiError ? err.message : 'بستن صندوق ناموفق بود.',
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
                  ? err.message
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
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">ثبت و بستن صندوق</h1>
          <p className="mt-1 text-sm text-text-muted">
            {coversUntil ? (
              <>
                {formatJalaliLong(businessDate)} تا{' '}
                {formatJalaliLong(coversUntil)}
              </>
            ) : (
              formatJalaliLong(businessDate)
            )}{' '}
            — {current.data.branch.name}
          </p>
        </div>
        <RegisterStatusBadge status={status as CashRegisterStatus} />
      </header>

      {draft.error && (
        <Alert tone="error" className="mb-4">
          {draft.error}
        </Alert>
      )}
      {draft.notice && (
        <Alert tone="success" className="mb-4">
          {draft.notice}
        </Alert>
      )}
      {coversUntil && (
        <Alert tone="info" className="mb-4">
          صندوق دوروزه: اقلام {formatJalaliLong(businessDate)} و{' '}
          {formatJalaliLong(coversUntil)} با هم در همین فرم ثبت و یکجا تراز
          می‌شوند.
        </Alert>
      )}
      {readOnly && (
        <Alert tone="info" className="mb-4">
          این صندوق بسته شده و تا بررسی حسابدار قابل ویرایش نیست.
        </Alert>
      )}

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
