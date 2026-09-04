import { UserRole, type UserRole as Role } from '@cashclose/shared';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from './features/auth/hooks/useAuth';
import { AdminPage } from './routes/AdminPage';
import { CashRegisterPage } from './routes/CashRegisterPage';
import { DashboardPage } from './routes/DashboardPage';
import { ReviewDetailPage } from './routes/ReviewDetailPage';
import { ReviewListPage } from './routes/ReviewListPage';
import { LoginPage } from './routes/LoginPage';

/**
 * مسیر محافظت‌شده.
 *
 * `roles` اختیاری است؛ اگر داده شود، کاربرِ بدون آن نقش به داشبورد
 * برمی‌گردد. این فقط لایهٔ راحتی کاربر است — تصمیم قطعی دسترسی همیشه
 * سمت بک‌اند گرفته می‌شود.
 */
function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // مسیر مقصد نگه داشته می‌شود تا پس از ورود، کاربر به همان‌جا برگردد.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
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
          path="/admin"
          element={
            <RequireAuth roles={[UserRole.STORE_MANAGER, UserRole.OWNER]}>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
