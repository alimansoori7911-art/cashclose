import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { useBranches } from '../../admin/hooks/useAdminData';
import type { ReportFilters } from '../hooks/report-filters';

interface Props {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}

/** نوار فیلتر گزارش‌ها — یک ردیف بالای نمودارها. */
export function ReportFilterBar({ filters, onChange }: Props) {
  const branches = useBranches();

  return (
    <div className="mb-5 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
      <TextInput
        label="از تاریخ"
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(event) =>
          onChange({ ...filters, dateFrom: event.target.value || undefined })
        }
        ltr
      />
      <TextInput
        label="تا تاریخ"
        type="date"
        value={filters.dateTo ?? ''}
        onChange={(event) =>
          onChange({ ...filters, dateTo: event.target.value || undefined })
        }
        ltr
      />
      <SelectInput
        label="شعبه"
        value={filters.branchId ?? ''}
        onChange={(branchId) =>
          onChange({ ...filters, branchId: branchId || undefined })
        }
        placeholder="همهٔ شعب"
        options={(branches.data?.items ?? []).map((branch) => ({
          value: branch.id,
          label: branch.name,
        }))}
      />
    </div>
  );
}
