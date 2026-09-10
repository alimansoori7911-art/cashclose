import {
  formatJalali,
  USER_ROLE_LABELS,
  type UserRole,
} from '@cashclose/shared';

import type { Column } from '../../../components/ui/DataTable/index';
import type { AdminUser } from '../hooks/useAdminData';
import { UserActions } from './UserActions';

/**
 * ستون‌های جدول کاربران.
 *
 * از خود تب جدا شده: «چه چیزی نشان بده» با «چه اتفاقی بیفتد» دو
 * مسئولیت متفاوت‌اند.
 */
export function buildUserColumns({
  actorId,
  actorRole,
  onEdit,
  onDeactivate,
}: {
  actorId: string | undefined;
  actorRole: string | undefined;
  onEdit: (user: AdminUser) => void;
  onDeactivate: (user: AdminUser) => void;
}): Column<AdminUser>[] {
  return [
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
      // رنگ تنها حامل معنا نیست: متن «فعال»/«غیرفعال» هم می‌آید.
      render: (u) => (
        <span
          className={u.status === 'active' ? 'text-balanced' : 'text-text-muted'}
        >
          {u.status === 'active' ? 'فعال' : 'غیرفعال'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <UserActions
          user={u}
          actorId={actorId}
          actorRole={actorRole}
          onEdit={() => onEdit(u)}
          onDeactivate={() => onDeactivate(u)}
        />
      ),
    },
  ];
}
