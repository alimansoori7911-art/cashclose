import {
  formatJalaliLong,
  type CashRegisterStatus,
} from '@cashclose/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { Alert } from '../components/ui/Alert/index';
import { RegisterStatusBadge } from '../components/ui/StatusBadge/index';
import { ReviewActions } from '../features/review/components/ReviewActions';
import { VersionDiff } from '../features/review/components/VersionDiff';
import {
  useVersionComparison,
  useVersions,
} from '../features/review/hooks/useReviewApi';
import { useRegisterDetail } from '../features/cash-register/hooks/useRegisterApi';
import { RegisterHistory } from '../features/review/components/RegisterHistory';
import { RegisterSummary } from '../features/review/components/RegisterSummary';
import { TransactionList } from '../features/review/components/TransactionList';

/** صفحهٔ بررسی یک صندوق. */
export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useRegisterDetail(id);
  const versions = useVersions(id);

  const [tab, setTab] = useState<'details' | 'diff' | 'history'>('details');

  const hasMultipleVersions = (versions.data?.length ?? 0) >= 2;
  const comparison = useVersionComparison(id, tab === 'diff');

  if (detail.isPending) {
    return (
      <AppLayout>
        <p className="text-text-muted">در حال بارگذاری…</p>
      </AppLayout>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <AppLayout>
        <Alert tone="error">دریافت اطلاعات صندوق ناموفق بود.</Alert>
      </AppLayout>
    );
  }

  const register = detail.data;

  const tabs = [
    { id: 'details' as const, label: 'جزئیات صندوق' },
    {
      id: 'diff' as const,
      label: 'مقایسهٔ نسخه‌ها',
      disabled: !hasMultipleVersions,
    },
    { id: 'history' as const, label: 'تاریخچه' },
  ];

  return (
    <AppLayout>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/review"
            className="mb-1 inline-block text-sm text-primary hover:underline"
          >
            ← بازگشت به فهرست
          </Link>
          <h1 className="text-xl font-bold text-text">
            صندوق {formatJalaliLong(register.businessDate.slice(0, 10))}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {register.branch.name} — {register.cashier.fullName}
          </p>
        </div>

        <RegisterStatusBadge status={register.status as CashRegisterStatus} />
      </div>

      <RegisterSummary
        registerBalance={register.registerBalance}
        documentsTotal={register.documentsTotal}
        difference={register.difference}
      />

      <div
        role="tablist"
        aria-label="بخش‌های بررسی"
        className="mb-4 mt-5 flex gap-1 border-b border-border"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            disabled={item.disabled}
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? 'border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary'
                : 'border-b-2 border-transparent px-4 py-2.5 text-sm text-text-muted transition-colors hover:text-text disabled:opacity-40 disabled:hover:text-text-muted'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mb-6">
        {tab === 'details' && (
          <TransactionList transactions={register.transactions} />
        )}

        {tab === 'diff' &&
          (comparison.isPending ? (
            <p className="text-text-muted">در حال بارگذاری…</p>
          ) : comparison.isError ? (
            <Alert tone="info">
              این صندوق تنها یک‌بار ارسال شده و نسخهٔ دیگری برای مقایسه ندارد.
            </Alert>
          ) : comparison.data ? (
            <VersionDiff data={comparison.data} />
          ) : null)}

        {tab === 'history' && <RegisterHistory history={register.history} />}
      </div>

      <ReviewActions
        registerId={register.id}
        status={register.status}
        onDone={() => void detail.refetch()}
      />
    </AppLayout>
  );
}
