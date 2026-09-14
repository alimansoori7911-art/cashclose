import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { api, ApiError } from '../../../lib/api';

/**
 * تغییر رمز توسط خود کاربر.
 *
 * رمز فعلی پرسیده می‌شود، نه برای سخت‌گیری بلکه برای احراز هویت: اگر
 * کسی پشت رایانهٔ بازِ صندوقدار بنشیند، بدون این قید می‌تواند رمز را
 * عوض کند و صاحب حساب را از سامانه بیرون بیندازد.
 */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // تأیید رمز فقط سمت کلاینت معنا دارد؛ سرور دو بار نمی‌خواهد.
    if (newPassword !== confirm) {
      setError('رمز تازه و تکرارش یکی نیستند.');
      return;
    }

    setSaving(true);

    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تغییر رمز ناموفق بود.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="رمز عبور تغییر کرد">
        <Alert tone="success">
          رمز شما با موفقیت تغییر کرد. دفعهٔ بعد با رمز تازه وارد شوید.
        </Alert>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>بستن</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="تغییر رمز عبور">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="رمز فعلی"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
          autoFocus
          ltr
        />

        <TextInput
          label="رمز تازه"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="حداقل ۸ نویسه، شامل حرف و رقم."
          autoComplete="new-password"
          required
          ltr
        />

        <TextInput
          label="تکرار رمز تازه"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          ltr
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={saving}>
            تغییر رمز
          </Button>
        </div>
      </form>
    </Modal>
  );
}
