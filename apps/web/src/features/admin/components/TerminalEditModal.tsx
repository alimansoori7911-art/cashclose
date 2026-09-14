import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import {
  useUpdate,
  type AdminUser,
  type PosTerminal,
} from '../hooks/useAdminData';

interface Props {
  terminal: PosTerminal;
  cashiers: AdminUser[];
  onClose: () => void;
}

/**
 * ویرایش کارتخوان.
 *
 * شعبه قابل تغییر نیست: تراکنش‌های ثبت‌شده به دستگاه وابسته‌اند و
 * جابه‌جایی آن بین شعبه‌ها گزارش‌های تاریخی شعبه را مخدوش می‌کند —
 * همان قاعده‌ای که بک‌اند هم اعمال می‌کند.
 */
export function TerminalEditModal({ terminal, cashiers, onClose }: Props) {
  const updateTerminal = useUpdate<
    Record<string, string | boolean>,
    PosTerminal
  >((id) => `/pos-terminals/${id}`, 'pos-terminals');

  const [name, setName] = useState(terminal.name);
  const [bank, setBank] = useState(terminal.bank ?? '');
  const [assignedToId, setAssignedToId] = useState(
    terminal.assignedTo?.id ?? '',
  );
  const [isActive, setActive] = useState(terminal.isActive);
  const [error, setError] = useState<string | null>(null);

  // فقط صندوقدارهای همان شعبه؛ تخصیص به صندوقدار شعبهٔ دیگر بی‌معناست.
  const branchCashiers = cashiers.filter(
    (user) => user.branchId === terminal.branchId && user.status === 'active',
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await updateTerminal.mutateAsync({
        id: terminal.id,
        body: {
          name: name.trim(),
          bank: bank.trim(),
          isActive,
          ...(assignedToId ? { assignedToId } : {}),
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
    <Modal open onClose={onClose} title={`ویرایش ${terminal.name}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="شعبه"
          value={terminal.branch.name}
          onChange={() => undefined}
          hint="دستگاه پس از ساخت به شعبهٔ دیگری منتقل نمی‌شود."
          disabled
        />

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
          label="صندوقدار مسئول"
          value={assignedToId}
          onChange={setAssignedToId}
          placeholder="— بدون تخصیص —"
          options={branchCashiers.map((user) => ({
            value: user.id,
            label: user.fullName,
          }))}
        />

        <SelectInput
          label="وضعیت"
          value={isActive ? 'active' : 'inactive'}
          onChange={(value) => setActive(value === 'active')}
          hint="دستگاه غیرفعال در فرم صندوق نمی‌آید، ولی سوابقش می‌ماند."
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
          ]}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={updateTerminal.isPending}>
            ذخیرهٔ تغییرات
          </Button>
        </div>
      </form>
    </Modal>
  );
}
