import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import {
  useResetOwnerPassword,
  useTenantOwners,
  type TenantSummary,
} from '../hooks/usePlatformApi';

interface Props {
  tenant: TenantSummary;
  onClose: () => void;
}

/**
 * بازنشانی رمز مالک — آخرین راه نجات.
 *
 * صندوقدار که رمزش را فراموش کند، مدیر فروشگاه رمز تازه می‌دهد. ولی
 * وقتی خودِ مالک فراموش کند، بالادستی‌ای در آن مجموعه نیست و فقط مدیر
 * سامانه می‌تواند کمک کند.
 */
export function OwnerRecoveryModal({ tenant, onClose }: Props) {
  const owners = useTenantOwners(tenant.id);
  const reset = useResetOwnerPassword(tenant.id);

  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!userId) {
      setError('مالک موردنظر را انتخاب کنید.');
      return;
    }

    try {
      const result = await reset.mutateAsync({ userId, newPassword });
      setDone(result.username);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تغییر رمز ناموفق بود.');
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="رمز مالک تغییر کرد">
        <Alert tone="warning" className="mb-4">
          این اطلاعات را به مالک بدهید و از او بخواهید پس از ورود، خودش
          رمز را عوض کند.
        </Alert>

        <div className="rounded-lg border border-border bg-bg p-4">
          <Row label="کد کسب‌وکار" value={tenant.code} />
          <Row label="نام کاربری" value={done} />
          <Row label="رمز تازه" value={newPassword} />
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>بستن</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`رمز تازه — ${tenant.name}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <SelectInput
          label="مالک"
          value={userId}
          onChange={setUserId}
          placeholder={owners.isPending ? 'در حال خواندن…' : '— انتخاب کنید —'}
          required
          options={(owners.data ?? []).map((owner) => ({
            value: owner.id,
            label: `${owner.fullName} (${owner.username})`,
          }))}
        />

        <TextInput
          label="رمز تازه"
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="حداقل ۸ نویسه، شامل حرف و رقم. آشکار است تا بتوانید یادداشتش کنید."
          required
          ltr
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={reset.isPending}>
            تعیین رمز
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="financial-figure text-sm font-medium text-text">
        {value}
      </span>
    </div>
  );
}
