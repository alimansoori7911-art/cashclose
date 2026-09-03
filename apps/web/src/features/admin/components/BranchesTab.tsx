import { useState } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import { Modal } from '../../../components/ui/Modal/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import {
  useBranches,
  useCreate,
  type Branch,
} from '../hooks/useAdminData';

/** مدیریت شعبه‌ها. */
export function BranchesTab() {
  const branches = useBranches();
  const createBranch = useCreate<
    { storeId: string; name: string; address?: string },
    Branch
  >('/branches', 'branches');

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  // فروشگاه از اولین شعبهٔ موجود گرفته می‌شود؛ در این فاز هر مستأجر یک
  // فروشگاه دارد و انتخاب دستی لازم نیست.
  const storeId = branches.data?.items[0]?.storeId;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !storeId) return;

    setError(null);
    try {
      await createBranch.mutateAsync({
        storeId,
        name: name.trim(),
        ...(address.trim() ? { address: address.trim() } : {}),
      });
      setName('');
      setAddress('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ثبت ناموفق بود.');
    }
  }

  const columns: Column<Branch>[] = [
    { key: 'name', header: 'نام شعبه', render: (b) => b.name },
    { key: 'store', header: 'فروشگاه', render: (b) => b.store.name },
    {
      key: 'users',
      header: 'کاربران',
      numeric: true,
      render: (b) => b._count.users,
    },
    {
      key: 'terminals',
      header: 'کارتخوان',
      numeric: true,
      render: (b) => b._count.posTerminals,
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (b) => (
        <span className={b.isActive ? 'text-balanced' : 'text-text-muted'}>
          {b.isActive ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {branches.data?.totalItems ?? 0} شعبه
        </p>
        <Button onClick={() => setOpen(true)}>افزودن شعبه</Button>
      </div>

      <DataTable
        columns={columns}
        rows={branches.data?.items ?? []}
        rowKey={(b) => b.id}
        isLoading={branches.isPending}
        error={branches.isError ? 'دریافت فهرست شعبه‌ها ناموفق بود.' : null}
        onRetry={() => branches.refetch()}
        emptyMessage="هنوز شعبه‌ای تعریف نشده است."
      />

      <Modal open={open} onClose={() => setOpen(false)} title="افزودن شعبه">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert tone="error">{error}</Alert>}

          <TextInput
            label="نام شعبه"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <TextInput
            label="نشانی"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" loading={createBranch.isPending}>
              ثبت شعبه
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
