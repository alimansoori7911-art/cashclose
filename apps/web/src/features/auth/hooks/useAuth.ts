import { useCallback, useSyncExternalStore } from 'react';

import { api } from '../../../lib/api';
import { session, type SessionUser } from '../session';

/**
 * وضعیت احراز هویت.
 *
 * از `useSyncExternalStore` استفاده می‌شود تا اگر کاربر در یک تب دیگر
 * خارج شود، این تب هم بلافاصله بفهمد — با state معمولی، تب‌ها از هم
 * بی‌خبر می‌ماندند.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  // رویداد `storage` فقط در تب‌های دیگر شلیک می‌شود.
  window.addEventListener('storage', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * `useSyncExternalStore` انتظار دارد snapshot بین فراخوانی‌ها با
 * `Object.is` برابر بماند. پس مقایسه روی **رشتهٔ خام** انجام می‌شود و
 * `JSON.parse` فقط وقتی اجرا می‌شود که مقدار واقعاً عوض شده باشد —
 * وگرنه هر رندر یک شیء جدید می‌ساخت و React در حلقه می‌افتاد.
 */
let cachedRaw: string | null = null;
let cachedUser: SessionUser | null = null;

function getSnapshot(): SessionUser | null {
  const raw = session.getUserRaw();

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedUser = session.getUser();
  }

  return cachedUser;
}

interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot);

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    session.save(result.accessToken, result.user);
    notify();
    return result.user;
  }, []);

  const logout = useCallback(() => {
    session.clear();
    notify();
  }, []);

  return { user, isAuthenticated: user !== null, login, logout };
}
