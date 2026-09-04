import { formatJalali, formatMoney } from '@cashclose/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { DataTable, type Column } from '../components/ui/DataTable/index';
import { RegisterStatusBadge } from '../components/ui/StatusBadge/index';
import { ReviewFilters } from '../features/review/components/ReviewFilters';
import {
  useRegisterList,
  type RegisterFilters,
  type ReviewRegister,
} from '../features/review/hooks/useReviewApi';

/** فهرست صندوق‌ها برای بررسی حسابدار. */
export function ReviewListPage() {
  // پیش‌فرض «در انتظار بررسی» است — کاری که حسابدار برای انجامش می‌آید.
  const [filters, setFilters] = useState<RegisterFilters>({
    status: 'submitted',
  });

  const registers = useRegisterList(filters);

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
    <AppLayout>
      <h1 className="mb-1 text-xl font-bold text-text">بررسی صندوق‌ها</h1>
      <p className="mb-5 text-sm text-text-muted">
        {registers.data?.totalItems?.toLocaleString('fa-IR') ?? '۰'} صندوق
      </p>

      <ReviewFilters filters={filters} onChange={setFilters} />

      <DataTable
        columns={columns}
        rows={registers.data?.items ?? []}
        rowKey={(r) => r.id}
        isLoading={registers.isPending}
        error={registers.isError ? 'دریافت فهرست صندوق‌ها ناموفق بود.' : null}
        onRetry={() => registers.refetch()}
        emptyMessage="صندوقی با این فیلترها یافت نشد."
      />
    </AppLayout>
  );
}
