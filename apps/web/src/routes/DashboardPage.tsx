import { USER_ROLE_LABELS } from '@cashclose/shared';

import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * داشبورد.
 *
 * در فازهای بعد جای خود را به داشبورد اختصاصی هر نقش می‌دهد؛ فعلاً
 * نقطهٔ ورود مشترک پس از لاگین است.
 */
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppLayout>
      <h1 className="mb-1 text-xl font-bold text-text">
        خوش آمدید، {user.fullName}
      </h1>
      <p className="mb-6 text-text-muted">
        {USER_ROLE_LABELS[user.role]}
        {user.branchId ? '' : ' — دسترسی ستادی'}
      </p>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 font-semibold text-text">وضعیت پیاده‌سازی</h2>
        <ul className="flex flex-col gap-2 text-sm text-text-muted">
          <li>✓ احراز هویت و تفکیک نقش‌ها</li>
          <li>✓ مدیریت فروشگاه، شعبه، کاربران و کارتخوان‌ها</li>
          <li>— ثبت و بستن صندوق روزانه (فاز بعد)</li>
        </ul>
      </section>
    </AppLayout>
  );
}
