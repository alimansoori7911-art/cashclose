import { formatJalali } from '@cashclose/shared';

import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import { useAuditLogs, type AuditLogEntry } from '../hooks/useAdminData';

/**
 * برچسب فارسی رویدادها.
 *
 * رویداد ناشناخته با همان نام فنی نمایش داده می‌شود تا لاگ هرگز خالی
 * به‌نظر نرسد — بهتر از پنهان‌کردن رویدادی است که ترجمه‌اش را نداریم.
 */
const ACTION_LABELS: Record<string, string> = {
  login_success: 'ورود موفق',
  login_failed: 'ورود ناموفق',
  password_reset_requested: 'درخواست بازیابی رمز',
  password_reset_completed: 'تغییر رمز عبور',
  user_created: 'ایجاد کاربر',
  user_updated: 'ویرایش کاربر',
  user_deactivated: 'غیرفعال‌سازی کاربر',
  user_password_reset_by_admin: 'بازنشانی رمز توسط مدیر',
  store_created: 'ایجاد فروشگاه',
  store_updated: 'ویرایش فروشگاه',
  store_deactivated: 'غیرفعال‌سازی فروشگاه',
  branch_created: 'ایجاد شعبه',
  branch_updated: 'ویرایش شعبه',
  branch_deactivated: 'غیرفعال‌سازی شعبه',
  pos_terminal_created: 'ایجاد کارتخوان',
  pos_terminal_updated: 'ویرایش کارتخوان',
  pos_terminal_deactivated: 'غیرفعال‌سازی کارتخوان',
};

/** لاگ عملیات — فقط نمایش، بدون امکان تغییر. */
export function AuditLogTab() {
  const logs = useAuditLogs();

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'action',
      header: 'رویداد',
      render: (l) => ACTION_LABELS[l.action] ?? l.action,
    },
    {
      key: 'user',
      header: 'کاربر',
      render: (l) => l.user?.fullName ?? '—',
    },
    {
      key: 'entity',
      header: 'مورد',
      render: (l) => {
        const meta = l.meta as { name?: string; username?: string } | null;
        return meta?.name ?? meta?.username ?? '—';
      },
    },
    {
      key: 'date',
      header: 'تاریخ',
      render: (l) => formatJalali(l.createdAt.slice(0, 10)),
    },
    {
      key: 'time',
      header: 'ساعت',
      render: (l) =>
        new Date(l.createdAt).toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        {logs.data?.totalItems ?? 0} رویداد ثبت‌شده — این فهرست فقط خواندنی است.
      </p>

      <DataTable
        columns={columns}
        rows={logs.data?.items ?? []}
        rowKey={(l) => l.id}
        isLoading={logs.isPending}
        error={logs.isError ? 'دریافت لاگ عملیات ناموفق بود.' : null}
        onRetry={() => logs.refetch()}
        emptyMessage="هنوز رویدادی ثبت نشده است."
      />
    </div>
  );
}
