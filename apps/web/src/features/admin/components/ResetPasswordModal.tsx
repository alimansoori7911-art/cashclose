import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { api, ApiError } from '../../../lib/api';
import type { AdminUser } from '../hooks/useAdminData';

interface Props {
  user: AdminUser;
  onClose: () => void;
}

/**
 * بازنشانی رمز کاربر توسط مدیر.
 *
 * برای وقتی که کاربر رمزش را فراموش کرده است. مدیر رمز تازه‌ای تعیین
 * می‌کند و شفاهی به او می‌دهد؛ کاربر بعد خودش از «تغییر رمز» عوضش
 * می‌کند.
 *
 * رمز فعلی پرسیده نمی‌شود — برخلاف تغییر رمز توسط خود کاربر — چون مدیر
 * آن را نمی‌داند و اصلاً نباید بداند.
 */
export function ResetPasswordModal({ user, onClose }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirm) {
      setError('رمز تازه و تکرارش یکی نیستند.');
      return;
    }

    setSaving(true);

    try {
      await api.patch(`/users/${user.id}/password`, { newPassword });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.displayMessage : 'تغییر رمز ناموفق بود.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="رمز تازه تعیین شد">
        <Alert tone="warning" className="mb-4">
          این رمز را به «{user.fullName}» بدهید و از او بخواهید پس از ورود،
          خودش آن را تغییر دهد.
        </Alert>

        <div className="rounded-lg border border-border bg-bg p-4 text-center">
          <p className="mb-1 text-xs text-text-muted">رمز تازه</p>
          <p className="financial-figure text-lg font-medium text-text">
            {newPassword}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>بستن</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`رمز تازه برای ${user.fullName}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <p className="text-sm text-text-muted">
          رمز فعلی کاربر در دسترس نیست و لازم هم نیست. رمز تازه‌ای تعیین
          کنید و به او بدهید.
        </p>

        <TextInput
          label="رمز تازه"
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="حداقل ۸ نویسه، شامل حرف و رقم. متن آشکار است تا بتوانید یادداشتش کنید."
          required
          autoFocus
          ltr
        />

        <TextInput
          label="تکرار رمز تازه"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          ltr
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={saving}>
            تعیین رمز
          </Button>
        </div>
      </form>
    </Modal>
  );
}
