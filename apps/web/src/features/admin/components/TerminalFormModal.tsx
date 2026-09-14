import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { useCreate, type Branch, type PosTerminal } from '../hooks/useAdminData';

interface Props {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
}

/** فرم ساخت کارتخوان. */
export function TerminalFormModal({ open, onClose, branches }: Props) {
  const createTerminal = useCreate<Record<string, string>, PosTerminal>(
    '/pos-terminals',
    'pos-terminals',
  );

  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeBranches = branches.filter((b) => b.isActive);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!branchId) {
      setError('انتخاب شعبه الزامی است.');
      return;
    }

    try {
      await createTerminal.mutateAsync({
        branchId,
        name: name.trim(),
        ...(bank.trim() ? { bank: bank.trim() } : {}),
      });
      setName('');
      setBank('');
      setBranchId('');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : 'ثبت ناموفق بود.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="افزودن کارتخوان">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="نام دستگاه"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <TextInput
          label="بانک"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
        />

        <SelectInput
          label="شعبه"
          value={branchId}
          onChange={setBranchId}
          placeholder="— انتخاب کنید —"
          required
          options={activeBranches.map((branch) => ({
            value: branch.id,
            label: branch.name,
          }))}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={createTerminal.isPending}>
            ثبت کارتخوان
          </Button>
        </div>
      </form>
    </Modal>
  );
}
