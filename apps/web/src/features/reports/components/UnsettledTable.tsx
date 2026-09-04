import { formatJalali, formatMoney } from '@cashclose/shared';

import { DataTable, type Column } from '../../../components/ui/DataTable/index';
import type { UnsettledReport } from '../hooks/useReports';

type Row = UnsettledReport['items'][number];

/**
 * خریدهای بدون تسویه (بند ۵ سمت مالک).
 *
 * برخلاف گزارش‌های فروش، صندوق‌های در انتظار بررسی هم اینجا می‌آیند:
 * بدهی مشتری واقعیتی است که مدیر باید بداند، حتی پیش از تأیید حسابدار.
 */
export function UnsettledTable({ data }: { data: UnsettledReport }) {
  const columns: Column<Row>[] = [
    { key: 'date', header: 'تاریخ', render: (r) => formatJalali(r.date) },
    { key: 'branch', header: 'شعبه', render: (r) => r.branchName },
    { key: 'cashier', header: 'صندوقدار', render: (r) => r.cashierName },
    {
      key: 'amount',
      header: 'مبلغ (ریال)',
      numeric: true,
      render: (r) => formatMoney(r.amount),
    },
    {
      key: 'description',
      header: 'توضیح',
      render: (r) => r.description ?? '—',
    },
    {
      key: 'status',
      header: 'وضعیت صندوق',
      render: (r) =>
        r.registerStatus === 'approved' ? (
          <span className="text-balanced">تأییدشده</span>
        ) : (
          <span className="text-warning">در انتظار بررسی</span>
        ),
    },
  ];

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">خریدهای بدون تسویه</h3>
        <p className="text-sm text-text-muted">
          {data.count.toLocaleString('fa-IR')} مورد — جمع{' '}
          <span className="financial-figure font-medium text-text">
            {formatMoney(data.total)}
          </span>{' '}
          ریال
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data.items}
        rowKey={(r) => r.id}
        emptyMessage="خرید بدون تسویه‌ای ثبت نشده است."
      />
    </section>
  );
}
