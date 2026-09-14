import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../hooks/useAuth';

/**
 * آیا آدرس فعلی زیردامنهٔ یک مشتری است؟
 *
 * `rafah.cashclose.ir` → بله | `cashclose.ir` یا آی‌پی خام → خیر
 */
function hasSubdomain(): boolean {
  const host = window.location.hostname;

  // آی‌پی خام زیردامنه ندارد.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;

  return host.split('.').length >= 3;
}

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
  const [businessCode, setBusinessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * آیا کد کسب‌وکار لازم است؟
   *
   * اگر سامانه از زیردامنهٔ اختصاصی مشتری باز شده باشد (`rafah.…`)،
   * آدرس خودش مجموعه را مشخص می‌کند و پرسیدن کد فقط مزاحمت است. در
   * آدرس مشترک — که حالت رایج است — کد از همان ابتدا خواسته می‌شود تا
   * کاربر اول خطا نگیرد و بعد کد بخواهد.
   */
  const [needsTenant, setNeedsTenant] = useState(() => !hasSubdomain());

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
      await login(
        username.trim(),
        password,
        businessCode.trim() || undefined,
      );
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

      {needsTenant && (
        <TextInput
          label="کد کسب‌وکار"
          value={businessCode}
          onChange={(event) => setBusinessCode(event.target.value)}
          hint="کد هشت‌نویسه‌ای که هنگام ثبت‌نام دریافت کرده‌اید."
          required
          ltr
          disabled={loading}
        />
      )}

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

      <Button type="submit" loading={loading} fullWidth>
        ورود
      </Button>
    </form>
  );
}
