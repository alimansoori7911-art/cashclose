import { USER_ROLE_LABELS, UserRole } from '@cashclose/shared';
import { Link } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../features/auth/hooks/useAuth';

/** میان‌بُرهای هر نقش — همان مسیرهایی که در منو هم مجازند. */
const SHORTCUTS: Record<
  string,
  { to: string; title: string; description: string }[]
> = {
  [UserRole.CASHIER]: [
    {
      to: '/cash-register',
      title: 'صندوق روزانه',
      description: 'ثبت اقلام، تراز کردن و بستن صندوق امروز',
    },
  ],
  [UserRole.ACCOUNTANT]: [
    {
      to: '/review',
      title: 'بررسی صندوق‌ها',
      description: 'تأیید یا رد صندوق‌های ارسال‌شده',
    },
  ],
  [UserRole.STORE_MANAGER]: [
    {
      to: '/reports',
      title: 'گزارش‌ها',
      description: 'فروش، مقایسهٔ شعب و پیش‌بینی ماه',
    },
    {
      to: '/admin',
      title: 'مدیریت فروشگاه',
      description: 'شعبه، کاربر و کارتخوان',
    },
  ],
  [UserRole.FINANCIAL_MANAGER]: [
    {
      to: '/reports',
      title: 'گزارش‌ها',
      description: 'فروش، مقایسهٔ شعب و پیش‌بینی ماه',
    },
  ],
  [UserRole.OWNER]: [
    {
      to: '/reports',
      title: 'گزارش‌ها',
      description: 'فروش، مقایسهٔ شعب و پیش‌بینی ماه',
    },
    {
      to: '/review',
      title: 'بررسی صندوق‌ها',
      description: 'وضعیت صندوق‌های در انتظار و ردشده',
    },
    {
      to: '/admin',
      title: 'مدیریت فروشگاه',
      description: 'شعبه، کاربر و کارتخوان',
    },
  ],
};

/** داشبورد — نقطهٔ ورود پس از لاگین. */
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const shortcuts = SHORTCUTS[user.role] ?? [];

  return (
    <AppLayout>
      <h1 className="mb-1 text-xl font-bold text-text">
        خوش آمدید، {user.fullName}
      </h1>
      <p className="mb-6 text-text-muted">
        {USER_ROLE_LABELS[user.role]}
        {user.branchId ? '' : ' — دسترسی ستادی'}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <h2 className="mb-1 font-semibold text-text">{item.title}</h2>
            <p className="text-sm text-text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
