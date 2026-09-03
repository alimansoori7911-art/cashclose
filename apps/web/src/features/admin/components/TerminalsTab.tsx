import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import { Modal } from '../../../components/ui/Modal/index';
import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import {
  useBranches,
  useCreate,
  useTerminals,
  type PosTerminal,
} from '../hooks/useAdminData';

/** مدیریت کارتخوان‌ها. */
export function TerminalsTab() {
  const terminals = useTerminals();
  const branches = useBranches();
  const createTerminal = useCreate<Record<string, string>, PosTerminal>(
    '/pos-terminals',
    'pos-terminals',
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeBranches = (branches.data?.items ?? []).filter((b) => b.isActive);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!branchId) {
      setError('انتخاب شعبه الزامی است.');
      return;
    }

    try {
      await createTerminal.mutateAsync({
        branchId,
        name: name.trim(),
        ...(bank.trim() ? { bank: bank.trim() } : {}),
      });
      setName('');
      setBank('');
      setBranchId('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ثبت ناموفق بود.');
    }
  }

  const columns: Column<PosTerminal>[] = [
    { key: 'name', header: 'نام دستگاه', render: (t) => t.name },
    { key: 'bank', header: 'بانک', render: (t) => t.bank ?? '—' },
    { key: 'branch', header: 'شعبه', render: (t) => t.branch.name },
    {
      key: 'assignee',
      header: 'مسئول',
      render: (t) => t.assignedTo?.fullName ?? '— کل شعبه',
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (t) => (
        <span className={t.isActive ? 'text-balanced' : 'text-text-muted'}>
          {t.isActive ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {terminals.data?.length ?? 0} کارتخوان
        </p>
        <Button onClick={() => setOpen(true)}>افزودن کارتخوان</Button>
      </div>

      <DataTable
        columns={columns}
        rows={terminals.data ?? []}
        rowKey={(t) => t.id}
        isLoading={terminals.isPending}
        error={terminals.isError ? 'دریافت فهرست کارتخوان‌ها ناموفق بود.' : null}
        onRetry={() => terminals.refetch()}
        emptyMessage="هنوز کارتخوانی تعریف نشده است."
      />

      <Modal open={open} onClose={() => setOpen(false)} title="افزودن کارتخوان">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert tone="error">{error}</Alert>}

          <TextInput
            label="نام دستگاه"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <TextInput
            label="بانک"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />

          <SelectInput
            label="شعبه"
            value={branchId}
            onChange={setBranchId}
            placeholder="— انتخاب کنید —"
            required
            options={activeBranches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" loading={createTerminal.isPending}>
              ثبت کارتخوان
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
