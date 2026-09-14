import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import {
  useCreateTenant,
  type CreateTenantResult,
} from '../hooks/usePlatformApi';

interface Props {
  onClose: () => void;
  /** رمز هم برمی‌گردد چون سرور هرگز آن را پس نمی‌دهد. */
  onCreated: (result: CreateTenantResult, password: string) => void;
}

/**
 * فرم ساخت کسب‌وکار تازه.
 *
 * شناسهٔ آدرس دستی گرفته می‌شود نه خودکار از نام: نام فارسی زیردامنهٔ
 * معتبر نمی‌سازد و حدس‌زدن، آدرسی بی‌معنا تولید می‌کند.
 */
export function CreateTenantForm({ onClose, onCreated }: Props) {
  const create = useCreateTenant();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('owner');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const result = await create.mutateAsync({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        ownerFullName: ownerFullName.trim(),
        ownerUsername: ownerUsername.trim(),
        ownerPassword,
      });
      onCreated(result, ownerPassword);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ثبت ناموفق بود.');
    }
  }

  return (
    <Modal open onClose={onClose} title="کسب‌وکار تازه">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="نام کسب‌وکار"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <TextInput
          label="شناسهٔ آدرس"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          hint="حروف کوچک لاتین، رقم و خط تیره — مثلاً refah"
          ltr
          required
        />

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium text-text">حساب مالک</p>

          <div className="flex flex-col gap-4">
            <TextInput
              label="نام و نام خانوادگی"
              value={ownerFullName}
              onChange={(e) => setOwnerFullName(e.target.value)}
              required
            />

            <TextInput
              label="نام کاربری"
              value={ownerUsername}
              onChange={(e) => setOwnerUsername(e.target.value)}
              hint="در هر کسب‌وکار جداگانه یکتاست؛ «owner» برای همه مجاز است."
              ltr
              required
            />

            <TextInput
              label="رمز اولیه"
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              hint="حداقل ۸ نویسه. مالک باید پس از اولین ورود تغییرش دهد."
              ltr
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={create.isPending}>
            ساخت کسب‌وکار
          </Button>
        </div>
      </form>
    </Modal>
  );
}
