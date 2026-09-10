import { UserRole } from '@cashclose/shared';

import type { AdminUser } from '../hooks/useAdminData';

interface Props {
  user: AdminUser;
  actorId: string | undefined;
  actorRole: string | undefined;
  onEdit: () => void;
  onDeactivate: () => void;
}

/**
 * دکمه‌های عملیات هر ردیف کاربر.
 *
 * قاعده‌های دسترسی همان‌هایی است که بک‌اند اعمال می‌کند؛ اینجا فقط
 * دکمه‌ای که به‌هرحال رد می‌شود نمایش داده نمی‌شود. تصمیم قطعی همیشه
 * سمت سرور گرفته می‌شود.
 */
export function UserActions({
  user,
  actorId,
  actorRole,
  onEdit,
  onDeactivate,
}: Props) {
  const isSelf = user.id === actorId;
  // فقط مالک می‌تواند کاربرِ مالک را تغییر دهد.
  const isProtectedOwner =
    user.role === UserRole.OWNER && actorRole !== UserRole.OWNER;

  const canEdit = !isProtectedOwner;
  // غیرفعال‌کردن خود یعنی قفل‌شدن بیرون از سامانه.
  const canDeactivate =
    !isSelf && !isProtectedOwner && user.status === 'active';

  return (
    <div className="flex items-center justify-end gap-1">
      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded px-2 py-1 text-sm text-primary transition-colors hover:bg-primary-soft"
        >
          ویرایش
        </button>
      )}

      {canDeactivate && (
        <button
          type="button"
          onClick={onDeactivate}
          className="rounded px-2 py-1 text-sm text-shortage transition-colors hover:bg-shortage-soft"
        >
          غیرفعال‌سازی
        </button>
      )}

      {isSelf && (
        <span className="px-2 text-xs text-text-muted">شما</span>
      )}
    </div>
  );
}
