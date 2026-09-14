import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { useCreate, type Branch } from '../hooks/useAdminData';

interface Props {
  open: boolean;
  onClose: () => void;
  /** فروشگاهی که شعبه زیر آن ساخته می‌شود. */
  storeId: string | undefined;
}

/** فرم ساخت شعبه. */
export function BranchFormModal({ open, onClose, storeId }: Props) {
  const createBranch = useCreate<
    { storeId: string; name: string; address?: string },
    Branch
  >('/branches', 'branches');

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !storeId) return;

    setError(null);
    try {
      await createBranch.mutateAsync({
        storeId,
        name: name.trim(),
        ...(address.trim() ? { address: address.trim() } : {}),
      });
      setName('');
      setAddress('');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : 'ثبت ناموفق بود.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="افزودن شعبه">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

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

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={createBranch.isPending}>
            ثبت شعبه
          </Button>
        </div>
      </form>
    </Modal>
  );
}
