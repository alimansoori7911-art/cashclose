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
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // فیلد مجموعه تا وقتی لازم نشده پنهان است: اکثر فروشگاه‌ها یک مجموعه
  // بیشتر ندارند و نمایش همیشگی‌اش فقط فرم را پیچیده می‌کند.
  const [needsTenant, setNeedsTenant] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    // اعتبارسنجی هنگام ارسال انجام می‌شود، نه با غیرفعال‌کردن دکمه:
    // دکمهٔ غیرفعال باعث می‌شد کلید Enter بی‌اثر بماند، در حالی که سند
    // صریحاً «Enter باعث لاگین می‌شود» را خواسته است.
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password, tenantId.trim() || undefined);
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'ورود ناموفق بود. دوباره تلاش کنید.';

      // سرور وقتی نام کاربری در چند مجموعه باشد همین را می‌گوید؛ در آن
      // حالت باید فیلد مجموعه ظاهر شود وگرنه کاربر به بن‌بست می‌خورد.
      if (message.includes('چند مجموعه')) setNeedsTenant(true);

      setError(message);
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

      {needsTenant && (
        // در استقرار واقعی هر مشتری زیردامنهٔ خودش را دارد و این فیلد
        // هرگز ظاهر نمی‌شود. فقط وقتی سامانه از آدرس بدون زیردامنه
        // (توسعه یا آی‌پی خام) باز شود به آن نیاز می‌افتد.
        <TextInput
          label="شناسهٔ مجموعه"
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value)}
          hint="سامانه از آدرس اختصاصی مجموعهٔ شما باز نشده است. با پشتیبانی تماس بگیرید."
          required
          autoFocus
          ltr
          disabled={loading}
        />
      )}

      <Button type="submit" loading={loading} fullWidth>
        ورود
      </Button>
    </form>
  );
}
