import { formatJalaliWithWeekday, todayIso } from '@cashclose/shared';

import { LoginForm } from '../features/auth/components/LoginForm';

/** صفحهٔ ورود — تنها صفحهٔ بدون نیاز به احراز هویت. */
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <main className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div
            aria-hidden
            className="grid size-12 place-items-center rounded-lg bg-primary text-lg font-bold text-white"
          >
            ص
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">
              سامانهٔ صندوق روزانه
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {formatJalaliWithWeekday(todayIso())}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <LoginForm
            onSuccess={() => {
              // بارگذاری کامل صفحه تا وضعیت نشست همه‌جا تازه شود.
              window.location.href = '/';
            }}
          />
        </div>

        <p className="mt-5 text-center text-xs text-text-muted">
          در صورت فراموشی رمز عبور با مدیر فروشگاه تماس بگیرید.
        </p>
      </main>
    </div>
  );
}
