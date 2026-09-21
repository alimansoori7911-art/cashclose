import { formatJalali } from '@cashclose/shared';

import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import {
  useTenantStatus,
  type TenantSummary,
} from '../hooks/usePlatformApi';

/** فهرست کسب‌وکارها — نمای مدیر سامانه. */
export function TenantTable({
  query,
  onRecoverOwner,
}: {
  query: {
    data?: TenantSummary[];
    isPending: boolean;
    isError: boolean;
    refetch: () => void;
  };
  onRecoverOwner: (tenant: TenantSummary) => void;
}) {
  const status = useTenantStatus();

  const columns: Column<TenantSummary>[] = [
    { key: 'name', header: 'کسب‌وکار', render: (t) => t.name },
    {
      key: 'code',
      header: 'کد',
      render: (t) => (
        <span className="financial-figure text-sm">{t.code}</span>
      ),
    },
    {
      key: 'slug',
      header: 'آدرس',
      render: (t) => (
        <span dir="ltr" className="inline-block text-sm text-text-muted">
          {t.slug}
        </span>
      ),
    },
    {
      key: 'branches',
      header: 'شعبه',
      numeric: true,
      render: (t) => t._count.branches,
    },
    {
      key: 'users',
      header: 'کاربر',
      numeric: true,
      render: (t) => t._count.users,
    },
    {
      key: 'created',
      header: 'تاریخ ساخت',
      render: (t) => formatJalali(t.createdAt.slice(0, 10)),
    },
    {
      key: 'status',
      header: 'وضعیت',
      // رنگ تنها حامل معنا نیست: متن وضعیت هم می‌آید.
      render: (t) => (
        <span
          className={t.status === 'active' ? 'text-balanced' : 'text-shortage'}
        >
          {t.status === 'active' ? 'فعال' : 'تعلیق'}
        </span>
      ),
    },
    {
      key: 'recover',
      header: '',
      // تنها راه نجات وقتی خودِ مالک رمزش را فراموش کند؛ بالادستی‌ای در
      // آن مجموعه نیست.
      render: (t) => (
        <button
          type="button"
          onClick={() => onRecoverOwner(t)}
          className="rounded px-2 py-1 text-sm text-primary transition-colors hover:bg-primary-soft"
        >
          رمز مالک
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <button
          type="button"
          disabled={status.isPending}
          onClick={() =>
            status.mutate({ id: t.id, suspend: t.status === 'active' })
          }
          className={[
            'rounded px-2 py-1 text-sm transition-colors',
            t.status === 'active'
              ? 'text-shortage hover:bg-shortage-soft'
              : 'text-balanced hover:bg-balanced-soft',
          ].join(' ')}
        >
          {t.status === 'active' ? 'تعلیق' : 'فعال‌سازی'}
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={query.data ?? []}
      rowKey={(t) => t.id}
      isLoading={query.isPending}
      error={query.isError ? 'دریافت فهرست کسب‌وکارها ناموفق بود.' : null}
      onRetry={() => query.refetch()}
      emptyMessage="هنوز کسب‌وکاری ساخته نشده است."
    />
  );
}
