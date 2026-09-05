import type { UserRole as Role } from '@cashclose/shared';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * مسیر محافظت‌شده.
 *
 * `roles` اختیاری است؛ اگر داده شود، کاربرِ بدون آن نقش به داشبورد
 * برمی‌گردد. این فقط لایهٔ راحتی کاربر است — تصمیم قطعی دسترسی همیشه
 * سمت بک‌اند گرفته می‌شود.
 */
export function RequireAuth({
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

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

/** حالت انتظار هنگام بارگذاری صفحات جداگانه. */
export function PageFallback() {
  return (
    <div className="grid min-h-screen place-items-center text-text-muted">
      در حال بارگذاری…
    </div>
  );
}
