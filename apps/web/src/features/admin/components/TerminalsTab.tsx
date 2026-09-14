import { useState } from 'react';

import { Button } from '../../../components/ui/Button/index';
import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import { ApiError } from '../../../lib/api';
import {
  useBranches,
  useDeactivate,
  useTerminals,
  useUsers,
  type PosTerminal,
} from '../hooks/useAdminData';
import { ConfirmDeactivate } from './ConfirmDeactivate';
import { RowActions } from './RowActions';
import { TerminalEditModal } from './TerminalEditModal';
import { TerminalFormModal } from './TerminalFormModal';

/** مدیریت کارتخوان‌ها. */
export function TerminalsTab() {
  const terminals = useTerminals();
  const branches = useBranches();
  const users = useUsers();
  const deactivate = useDeactivate(
    (id) => `/pos-terminals/${id}`,
    'pos-terminals',
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PosTerminal | null>(null);
  const [removing, setRemoving] = useState<PosTerminal | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

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
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <RowActions
          isActive={t.isActive}
          onEdit={() => setEditing(t)}
          onDeactivate={() => {
            setRemoveError(null);
            setRemoving(t);
          }}
        />
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

      <TerminalFormModal
        open={open}
        onClose={() => setOpen(false)}
        branches={branches.data?.items ?? []}
      />

      {editing && (
        <TerminalEditModal
          terminal={editing}
          cashiers={(users.data?.items ?? []).filter(
            (user) => user.role === 'cashier',
          )}
          onClose={() => setEditing(null)}
        />
      )}

      {removing && (
        <ConfirmDeactivate
          title="غیرفعال‌سازی کارتخوان"
          name={removing.name}
          note="دستگاه در فرم صندوق نمی‌آید، ولی تراکنش‌های ثبت‌شده‌اش دست‌نخورده می‌مانند."
          pending={deactivate.isPending}
          error={removeError}
          onCancel={() => setRemoving(null)}
          onConfirm={() => void handleDeactivate()}
        />
      )}
    </div>
  );
}
