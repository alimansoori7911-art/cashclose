import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { useUpdate, type Branch } from '../hooks/useAdminData';

interface Props {
  branch: Branch;
  onClose: () => void;
}

/**
 * ویرایش شعبه.
 *
 * فروشگاه قابل تغییر نیست: صندوق‌های ثبت‌شده به شعبه وابسته‌اند و
 * جابه‌جایی آن بین فروشگاه‌ها گزارش‌های تاریخی را بی‌معنا می‌کند —
 * همان قاعده‌ای که بک‌اند هم اعمال می‌کند.
 */
export function BranchEditModal({ branch, onClose }: Props) {
  const updateBranch = useUpdate<Record<string, string | boolean>, Branch>(
    (id) => `/branches/${id}`,
    'branches',
  );

  const [name, setName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address ?? '');
  const [isActive, setActive] = useState(branch.isActive);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await updateBranch.mutateAsync({
        id: branch.id,
        body: {
          name: name.trim(),
          address: address.trim(),
          isActive,
        },
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.displayMessage : 'ویرایش ناموفق بود.',
      );
    }
  }

  return (
    <Modal open onClose={onClose} title={`ویرایش ${branch.name}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="فروشگاه"
          value={branch.store.name}
          onChange={() => undefined}
          hint="شعبه پس از ساخت به فروشگاه دیگری منتقل نمی‌شود."
          disabled
        />

        <TextInput
          label="نام شعبه"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <TextInput
          label="نشانی"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <SelectInput
          label="وضعیت"
          value={isActive ? 'active' : 'inactive'}
          onChange={(value) => setActive(value === 'active')}
          hint="شعبهٔ غیرفعال در فهرست‌ها نمی‌آید، ولی سوابقش می‌ماند."
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
          ]}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={updateBranch.isPending}>
            ذخیرهٔ تغییرات
          </Button>
        </div>
      </form>
    </Modal>
  );
}
