import type { CashRegisterStatus } from '@cashclose/shared';

import { AppLayout } from '../components/layout/AppLayout';
import { CompletenessModal } from '../features/cash-register/components/CompletenessModal';
import { NoRegisterState } from '../features/cash-register/components/NoRegisterState';
import { RegisterBody } from '../features/cash-register/components/RegisterBody';
import { RegisterHeader } from '../features/cash-register/components/RegisterHeader';
import { SummaryBar } from '../features/cash-register/components/SummaryBar';
import {
  useAutoSave,
  useUnsavedWarning,
} from '../features/cash-register/hooks/useAutoSave';
import { useCloseFlow } from '../features/cash-register/hooks/useCloseFlow';
import { useDifferenceHelp } from '../features/cash-register/hooks/useDifferenceHelp';
import { useCreateFlow } from '../features/cash-register/hooks/useCreateFlow';
import { useDraftSaver } from '../features/cash-register/hooks/useDraftSaver';
import { useFocusRow } from '../features/cash-register/hooks/useFocusRow';
import { useShortcuts } from '../features/cash-register/hooks/useShortcuts';
import { useLoadedRegisterForm } from '../features/cash-register/hooks/useLoadedRegisterForm';
import {
  useCloseRegister,
  useCurrentRegister,
  usePreviousTransactions,
  useRegisterDetail,
} from '../features/cash-register/hooks/useRegisterApi';

/** صفحهٔ ثبت و بستن صندوق روزانه. */
export function CashRegisterPage() {
  const current = useCurrentRegister();
  const registerId = current.data?.id;

  const detail = useRegisterDetail(registerId);
  const closeRegister = useCloseRegister(registerId);
  const form = useLoadedRegisterForm(detail.data);
  const draft = useDraftSaver(registerId, form);

  const createFlow = useCreateFlow();
  const focus = useFocusRow();
  const previous = usePreviousTransactions(registerId);
  const help = useDifferenceHelp(
    form.rows,
    Number(form.calculation.difference),
    previous.data,
  );
  const closeFlow = useCloseFlow({
    rows: form.rows,
    draft,
    closeRegister,
  });

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
  useShortcuts({
    enabled: Boolean(registerId) && !readOnly,
    onSave: () => void draft.saveDraft().catch(() => undefined),
  });

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
          creating={createFlow.creating}
          error={createFlow.error}
          onCreate={(options) => void createFlow.create(options)}
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

      <RegisterBody
        rows={form.rows}
        calculation={form.calculation}
        readOnly={readOnly}
        previousByType={help.previousByType}
        focusTarget={focus.target}
        suggestions={help.suggestions}
        anomalies={help.anomalies}
        onUpdate={form.update}
        onAddRow={form.addRow}
        onSuggestionPick={(type) => focus.focusRow(form.ensureRow(type))}
        onRemoveRow={form.removeRow}
      />

      <div className="h-6" />

      <SummaryBar
        calculation={form.calculation}
        readOnly={readOnly}
        saving={draft.saving}
        closing={closeRegister.isPending}
        onSaveDraft={() => void draft.saveDraft().catch(() => undefined)}
        onClose={closeFlow.requestClose}
      />

      {closeFlow.showModal && (
        <CompletenessModal
          open
          onClose={closeFlow.closeModal}
          missing={closeFlow.completeness.missing}
          rows={form.rows}
          closing={closeFlow.closing}
          onUpdate={form.update}
          onConfirm={closeFlow.performClose}
        />
      )}
    </AppLayout>
  );
}
