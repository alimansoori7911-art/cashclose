import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../hooks/useAuth';

/**
 * فرم ورود.
 *
 * پیام خطا عمداً کلی است («نام کاربری یا رمز عبور اشتباه است») و بین
 * «کاربر وجود ندارد» و «رمز غلط» تفاوت نمی‌گذارد — همان رفتاری که
 * بک‌اند دارد، تا فهرست کاربران معتبر لو نرود.
 */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'ورود ناموفق بود. دوباره تلاش کنید.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert tone="error">{error}</Alert>}

      <TextInput
        label="نام کاربری"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
        autoFocus
        required
        ltr
        disabled={loading}
      />

      <TextInput
        label="رمز عبور"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
        ltr
        disabled={loading}
      />

      <Button
        type="submit"
        loading={loading}
        fullWidth
        disabled={!username.trim() || !password}
      >
        ورود
      </Button>
    </form>
  );
}
