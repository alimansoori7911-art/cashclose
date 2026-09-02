import {
  calculateCashRegister,
  formatJalaliWithWeekday,
  formatRial,
  todayIso,
  TransactionType,
} from '@cashclose/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { NumberInput } from './components/ui/NumberInput/index';
import { CashStatusBadge } from './components/ui/StatusBadge/index';
import { api } from './lib/api';

/**
 * صفحهٔ راستی‌آزمایی فاز صفر.
 *
 * هدف: اثبات اینکه زنجیرهٔ کامل کار می‌کند — فرانت به بک‌اند وصل است،
 * بستهٔ مشترک در هر دو سمت اجرا می‌شود، تاریخ جلالی و RTL درست‌اند و
 * توکن‌های رنگ اعمال شده‌اند. در فاز ۱ با صفحهٔ ورود جایگزین می‌شود.
 */
export function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string; version: string }>('/health'),
  });

  // یک نمونهٔ کوچک از فرم صندوق تا موتور محاسبه به‌صورت زنده دیده شود.
  const [sales, setSales] = useState<number | null>(16_000_000);
  const [goodsReturn, setGoodsReturn] = useState<number | null>(1_000_000);
  const [cash, setCash] = useState<number | null>(15_000_000);

  const result = calculateCashRegister([
    { type: TransactionType.SALES_TOTAL, amount: sales ?? 0 },
    { type: TransactionType.GOODS_RETURN, amount: goodsReturn ?? 0 },
    { type: TransactionType.CASH, amount: cash ?? 0 },
  ]);

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text">سامانهٔ صندوق روزانه</h1>
          <p className="text-text-muted">
            {formatJalaliWithWeekday(todayIso())}
          </p>
        </header>

        {/* وضعیت اتصال به بک‌اند */}
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 font-semibold text-text">وضعیت سرویس‌ها</h2>
          <dl className="flex items-center justify-between text-sm">
            <dt className="text-text-muted">اتصال به بک‌اند</dt>
            <dd>
              {health.isPending && <span className="text-text-muted">در حال بررسی…</span>}
              {health.isError && (
                <span className="text-shortage">
                  ناموفق — آیا سرویس API اجرا شده است؟
                </span>
              )}
              {health.isSuccess && (
                <span className="text-balanced">
                  برقرار (نسخهٔ {health.data.version})
                </span>
              )}
            </dd>
          </dl>
        </section>

        {/* آزمون زندهٔ موتور محاسبه */}
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-1 font-semibold text-text">آزمون موتور محاسبه</h2>
          <p className="mb-4 text-sm text-text-muted">
            همان فرمولی که بک‌اند پیش از بستن صندوق اجرا می‌کند — اینجا
            به‌صورت زنده.
          </p>

          <div className="flex flex-col gap-4">
            <NumberInput label="فروش کل" value={sales} onChange={setSales} />
            <NumberInput
              label="برگشت کالا"
              value={goodsReturn}
              onChange={setGoodsReturn}
            />
            <NumberInput label="نقدی" value={cash} onChange={setCash} />
          </div>

          <dl className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">مانده صندوق</dt>
              <dd className="financial-figure font-medium text-text">
                {formatRial(result.registerBalance)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">جمع اسناد</dt>
              <dd className="financial-figure font-medium text-text">
                {formatRial(result.documentsTotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <dt className="font-medium text-text">اختلاف</dt>
              <dd className="flex items-center gap-3">
                <span className="financial-figure font-semibold text-text">
                  {formatRial(result.difference)}
                </span>
                <CashStatusBadge status={result.status} />
              </dd>
            </div>
          </dl>

          <p
            className={
              result.canClose
                ? 'mt-4 rounded bg-balanced-soft px-3 py-2 text-sm text-balanced'
                : 'mt-4 rounded bg-warning-soft px-3 py-2 text-sm text-warning'
            }
          >
            {result.canClose
              ? 'صندوق تراز است و قابل بستن می‌باشد.'
              : 'تا زمانی که اختلاف صفر نشود، بستن صندوق مجاز نیست.'}
          </p>
        </section>
      </main>
    </div>
  );
}
