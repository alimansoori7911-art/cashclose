import { useState } from 'react';

import { Button } from '../../../components/ui/Button/index';
import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import { ApiError } from '../../../lib/api';
import {
  useBranches,
  useDeactivate,
  type Branch,
} from '../hooks/useAdminData';
import { BranchEditModal } from './BranchEditModal';
import { BranchFormModal } from './BranchFormModal';
import { ConfirmDeactivate } from './ConfirmDeactivate';
import { RowActions } from './RowActions';

/** مدیریت شعبه‌ها. */
export function BranchesTab() {
  const branches = useBranches();
  const deactivate = useDeactivate((id) => `/branches/${id}`, 'branches');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [removing, setRemoving] = useState<Branch | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // فروشگاه از اولین شعبهٔ موجود گرفته می‌شود؛ در این فاز هر مستأجر یک
  // فروشگاه دارد و انتخاب دستی لازم نیست.
  const storeId = branches.data?.items[0]?.storeId;

  async function handleDeactivate() {
    if (!removing) return;
    setRemoveError(null);

    try {
      await deactivate.mutateAsync(removing.id);
      setRemoving(null);
    } catch (err) {
      setRemoveError(
        err instanceof ApiError
          ? err.displayMessage
          : 'غیرفعال‌سازی ناموفق بود.',
      );
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
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <RowActions
          isActive={b.isActive}
          onEdit={() => setEditing(b)}
          onDeactivate={() => {
            setRemoveError(null);
            setRemoving(b);
          }}
        />
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

      {editing && (
        <BranchEditModal branch={editing} onClose={() => setEditing(null)} />
      )}

      {removing && (
        <ConfirmDeactivate
          title="غیرفعال‌سازی شعبه"
          name={removing.name}
          note="شعبه در فهرست‌ها نمی‌آید، ولی صندوق‌ها و سوابقش دست‌نخورده می‌مانند."
          pending={deactivate.isPending}
          error={removeError}
          onCancel={() => setRemoving(null)}
          onConfirm={() => void handleDeactivate()}
        />
      )}

      <BranchFormModal
        open={open}
        onClose={() => setOpen(false)}
        storeId={storeId}
      />
    </div>
  );
}
