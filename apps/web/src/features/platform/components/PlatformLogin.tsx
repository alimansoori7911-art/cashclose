import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { usePlatformLogin } from '../hooks/usePlatformApi';
import { platformSession } from '../platform-client';

/** ورود مدیر سامانه — جدا از ورود کاربران مشتری. */
export function PlatformLogin({ onSuccess }: { onSuccess: () => void }) {
  const login = usePlatformLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const result = await login.mutateAsync({ username, password });
      platformSession.set(result.accessToken);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'ورود ناموفق بود. دوباره تلاش کنید.',
      );
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-1 text-center text-xl font-bold text-text">
        پنل مدیر سامانه
      </h1>
      <p className="mb-6 text-center text-sm text-text-muted">
        ساخت و مدیریت کسب‌وکارها
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5"
      >
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="نام کاربری"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          ltr
          required
          autoFocus
        />

        <TextInput
          label="رمز عبور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          ltr
          required
        />

        <Button type="submit" loading={login.isPending}>
          ورود
        </Button>
      </form>
    </div>
  );
}
