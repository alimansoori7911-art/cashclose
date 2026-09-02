import {
  formatJalaliWithWeekday,
  todayIso,
  USER_ROLE_LABELS,
} from '@cashclose/shared';

import { Button } from '../components/ui/Button/index';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * داشبورد موقت فاز ۱.
 *
 * فقط اثبات می‌کند که نشست کار می‌کند و نقش کاربر درست تشخیص داده
 * می‌شود. در فازهای بعد جای خود را به داشبورد اختصاصی هر نقش می‌دهد.
 */
export function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-white"
            >
              ص
            </div>
            <div>
              <div className="text-sm font-semibold text-text">
                سامانهٔ صندوق روزانه
              </div>
              <div className="text-xs text-text-muted">
                {formatJalaliWithWeekday(todayIso())}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left">
              <div className="text-sm font-medium text-text">
                {user.fullName}
              </div>
              <div className="text-xs text-text-muted">
                {USER_ROLE_LABELS[user.role]}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-1 text-xl font-bold text-text">
          خوش آمدید، {user.fullName}
        </h1>
        <p className="mb-6 text-text-muted">
          احراز هویت و تفکیک نقش‌ها فعال است. ماژول‌های کاری در فازهای بعد
          اضافه می‌شوند.
        </p>

        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 font-semibold text-text">مشخصات نشست</h2>
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-text-muted">نام کاربری</dt>
              <dd dir="ltr" className="font-medium text-text">
                {user.username}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-text-muted">نقش</dt>
              <dd className="font-medium text-text">
                {USER_ROLE_LABELS[user.role]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">شعبه</dt>
              <dd className="font-medium text-text">
                {user.branchId ? 'تخصیص‌یافته' : 'دسترسی ستادی (بدون شعبه)'}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
