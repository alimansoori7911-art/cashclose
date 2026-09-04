import { CASH_REGISTER_STATUS_LABELS, CashRegisterStatus } from '@cashclose/shared';

import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { useBranches } from '../../admin/hooks/useAdminData';
import type { RegisterFilters } from '../hooks/useReviewApi';

interface Props {
  filters: RegisterFilters;
  onChange: (filters: RegisterFilters) => void;
}

/**
 * نوار فیلتر حسابدار (بند AC6 سند).
 *
 * همهٔ فیلترها روی API اعمال می‌شوند نه سمت کلاینت — با چند هزار صندوق،
 * فیلتر سمت کلاینت یعنی دانلود کل داده.
 */
export function ReviewFilters({ filters, onChange }: Props) {
  const branches = useBranches();

  function update(patch: Partial<RegisterFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="mb-4 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
      <SelectInput
        label="وضعیت"
        value={filters.status ?? ''}
        onChange={(status) => update({ status: status || undefined })}
        placeholder="همه"
        options={Object.values(CashRegisterStatus).map((value) => ({
          value,
          label: CASH_REGISTER_STATUS_LABELS[value],
        }))}
      />

      <SelectInput
        label="شعبه"
        value={filters.branchId ?? ''}
        onChange={(branchId) => update({ branchId: branchId || undefined })}
        placeholder="همه"
        options={(branches.data?.items ?? []).map((branch) => ({
          value: branch.id,
          label: branch.name,
        }))}
      />

      <TextInput
        label="از تاریخ"
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(event) =>
          update({ dateFrom: event.target.value || undefined })
        }
        ltr
      />

      <TextInput
        label="تا تاریخ"
        type="date"
        value={filters.dateTo ?? ''}
        onChange={(event) => update({ dateTo: event.target.value || undefined })}
        ltr
      />
    </div>
  );
}
