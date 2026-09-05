import { UserRole } from '@cashclose/shared';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { CashRegisterPage } from './routes/CashRegisterPage';
import { DashboardPage } from './routes/DashboardPage';
import {
  PageFallback,
  RedirectIfAuthenticated,
  RequireAuth,
} from './routes/guards';
import { LoginPage } from './routes/LoginPage';

/**
 * صفحات سنگین جداگانه بارگذاری می‌شوند.
 *
 * صفحهٔ گزارش‌ها کتابخانهٔ نمودار را می‌آورد که به‌تنهایی بخش بزرگی از
 * حجم برنامه است. صندوقدار — پرکاربرترین نقش — هرگز این صفحه را باز
 * نمی‌کند، پس نباید هزینهٔ دانلودش را بدهد.
 */
const ReportsPage = lazy(() =>
  import('./routes/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const AdminPage = lazy(() =>
  import('./routes/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const ReviewListPage = lazy(() =>
  import('./routes/ReviewListPage').then((m) => ({
    default: m.ReviewListPage,
  })),
);
const ReviewDetailPage = lazy(() =>
  import('./routes/ReviewDetailPage').then((m) => ({
    default: m.ReviewDetailPage,
  })),
);

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/cash-register"
            element={
              <RequireAuth roles={[UserRole.CASHIER]}>
                <CashRegisterPage />
              </RequireAuth>
            }
          />
          <Route
            path="/review"
            element={
              <RequireAuth roles={[UserRole.ACCOUNTANT, UserRole.OWNER]}>
                <ReviewListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/review/:id"
            element={
              <RequireAuth roles={[UserRole.ACCOUNTANT, UserRole.OWNER]}>
                <ReviewDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth
                roles={[
                  UserRole.OWNER,
                  UserRole.FINANCIAL_MANAGER,
                  UserRole.STORE_MANAGER,
                ]}
              >
                <ReportsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth roles={[UserRole.STORE_MANAGER, UserRole.OWNER]}>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
