import { useState } from 'react';

import { Button } from '../../../components/ui/Button/index';
import { DataTable } from '../../../components/ui/DataTable/index';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  useBranches,
  useDeactivate,
  useUsers,
  type AdminUser,
} from '../hooks/useAdminData';
import { ConfirmDeactivate } from './ConfirmDeactivate';
import { buildUserColumns } from './user-columns';
import { UserEditModal } from './UserEditModal';
import { UserFormModal } from './UserFormModal';

/** مدیریت کاربران. */
export function UsersTab() {
  const { user: actor } = useAuth();
  const users = useUsers();
  const branches = useBranches();
  const deactivate = useDeactivate((id) => `/users/${id}`, 'users');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState<AdminUser | null>(null);
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

  const columns = buildUserColumns({
    actorId: actor?.id,
    actorRole: actor?.role,
    onEdit: setEditing,
    onDeactivate: (user) => {
      setRemoveError(null);
      setRemoving(user);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {users.data?.totalItems ?? 0} کاربر
        </p>
        <Button onClick={() => setCreating(true)}>افزودن کاربر</Button>
      </div>

      <DataTable
        columns={columns}
        rows={users.data?.items ?? []}
        rowKey={(u) => u.id}
        isLoading={users.isPending}
        error={users.isError ? 'دریافت فهرست کاربران ناموفق بود.' : null}
        onRetry={() => users.refetch()}
        emptyMessage="هنوز کاربری تعریف نشده است."
      />

      <UserFormModal
        open={creating}
        onClose={() => setCreating(false)}
        branches={branches.data?.items ?? []}
      />

      {editing && (
        <UserEditModal
          user={editing}
          branches={branches.data?.items ?? []}
          onClose={() => setEditing(null)}
        />
      )}

      {removing && (
        <ConfirmDeactivate
          title="غیرفعال‌سازی کاربر"
          name={removing.fullName}
          note="کاربر دیگر نمی‌تواند وارد شود، ولی صندوق‌ها و سوابقش دست‌نخورده می‌مانند."
          pending={deactivate.isPending}
          error={removeError}
          onCancel={() => setRemoving(null)}
          onConfirm={() => void handleDeactivate()}
        />
      )}
    </div>
  );
}
