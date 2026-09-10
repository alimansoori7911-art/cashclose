import { formatJalali, formatMoney } from '@cashclose/shared';
import { Link } from 'react-router-dom';

import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import { RegisterStatusBadge } from '../../../components/ui/StatusBadge/index';
import type { useRegisterList, ReviewRegister } from '../hooks/useReviewApi';

/** نمای فهرستی صندوق‌ها — کار روزمرهٔ حسابدار. */
export function ReviewTable({
  query,
}: {
  query: ReturnType<typeof useRegisterList>;
}) {
  const columns: Column<ReviewRegister>[] = [
    {
      key: 'date',
      header: 'تاریخ',
      render: (r) => formatJalali(r.businessDate.slice(0, 10)),
    },
    { key: 'branch', header: 'شعبه', render: (r) => r.branch.name },
    { key: 'cashier', header: 'صندوقدار', render: (r) => r.cashier.fullName },
    {
      key: 'balance',
      header: 'مانده صندوق',
      numeric: true,
      render: (r) => formatMoney(r.registerBalance),
    },
    {
      key: 'documents',
      header: 'جمع اسناد',
      numeric: true,
      render: (r) => formatMoney(r.documentsTotal),
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (r) => <RegisterStatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Link
          to={`/review/${r.id}`}
          className="text-sm text-primary hover:underline"
        >
          بررسی
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={query.data?.items ?? []}
      rowKey={(r) => r.id}
      isLoading={query.isPending}
      error={query.isError ? 'دریافت فهرست صندوق‌ها ناموفق بود.' : null}
      onRetry={() => query.refetch()}
      emptyMessage="صندوقی با این فیلترها یافت نشد."
    />
  );
}
