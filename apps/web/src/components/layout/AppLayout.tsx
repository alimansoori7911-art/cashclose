import {
  formatJalaliWithWeekday,
  todayIso,
  USER_ROLE_LABELS,
  UserRole,
  type UserRole as Role,
} from '@cashclose/shared';
import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from '../../features/auth/hooks/useAuth';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { Button } from '../ui/Button/index';

/** آیتم‌های منو و نقش‌هایی که به آن‌ها دسترسی دارند. */
const NAV_ITEMS: { path: string; label: string; roles: Role[] }[] = [
  {
    path: '/',
    label: 'داشبورد',
    roles: Object.values(UserRole),
  },
  {
    path: '/cash-register',
    label: 'صندوق روزانه',
    roles: [UserRole.CASHIER],
  },
  {
    path: '/review',
    label: 'بررسی صندوق‌ها',
    roles: [UserRole.ACCOUNTANT, UserRole.OWNER],
  },
  {
    path: '/admin',
    label: 'مدیریت فروشگاه',
    roles: [UserRole.STORE_MANAGER, UserRole.OWNER],
  },
];

/** چارچوب مشترک صفحات پس از ورود: نوار بالا، منو و ناحیهٔ محتوا. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
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

          <div className="flex items-center gap-3">
            <NotificationBell />
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

        {visibleItems.length > 1 && (
          <nav className="mx-auto max-w-5xl px-6">
            <ul className="flex gap-1">
              {visibleItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    aria-current={
                      location.pathname === item.path ? 'page' : undefined
                    }
                    className={
                      location.pathname === item.path
                        ? 'inline-block border-b-2 border-primary px-3 py-2.5 text-sm font-medium text-primary'
                        : 'inline-block border-b-2 border-transparent px-3 py-2.5 text-sm text-text-muted transition-colors hover:text-text'
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
