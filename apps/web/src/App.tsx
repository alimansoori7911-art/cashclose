import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from './features/auth/hooks/useAuth';
import { DashboardPage } from './routes/DashboardPage';
import { LoginPage } from './routes/LoginPage';

/** مسیری که بدون نشست معتبر به صفحهٔ ورود هدایت می‌شود. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // مسیر مقصد نگه داشته می‌شود تا پس از ورود، کاربر به همان‌جا برگردد.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/** صفحهٔ ورود برای کاربرِ از قبل واردشده معنا ندارد. */
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
