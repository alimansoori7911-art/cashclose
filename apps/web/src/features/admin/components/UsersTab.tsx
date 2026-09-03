import { USER_ROLE_LABELS, type UserRole } from '@cashclose/shared';
import { useState } from 'react';

import { Button } from '../../../components/ui/Button/index';
import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import { formatJalali } from '@cashclose/shared';
import {
  useBranches,
  useUsers,
  type AdminUser,
} from '../hooks/useAdminData';
import { UserFormModal } from './UserFormModal';

/** مدیریت کاربران. */
export function UsersTab() {
  const users = useUsers();
  const branches = useBranches();
  const [open, setOpen] = useState(false);

  const columns: Column<AdminUser>[] = [
    { key: 'fullName', header: 'نام', render: (u) => u.fullName },
    {
      key: 'username',
      header: 'نام کاربری',
      render: (u) => (
        <span dir="ltr" className="inline-block">
          {u.username}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'نقش',
      render: (u) => USER_ROLE_LABELS[u.role as UserRole] ?? u.role,
    },
    {
      key: 'branch',
      header: 'شعبه',
      render: (u) => u.branch?.name ?? '— ستادی',
    },
    {
      key: 'lastLogin',
      header: 'آخرین ورود',
      render: (u) =>
        u.lastLoginAt ? formatJalali(u.lastLoginAt.slice(0, 10)) : '—',
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (u) => (
        <span
          className={u.status === 'active' ? 'text-balanced' : 'text-text-muted'}
        >
          {u.status === 'active' ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {users.data?.totalItems ?? 0} کاربر
        </p>
        <Button onClick={() => setOpen(true)}>افزودن کاربر</Button>
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
        open={open}
        onClose={() => setOpen(false)}
        branches={branches.data?.items ?? []}
      />
    </div>
  );
}
