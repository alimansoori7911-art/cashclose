import { USER_ROLE_LABELS, UserRole } from '@cashclose/shared';
import { useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { useCreate, type AdminUser, type Branch } from '../hooks/useAdminData';

interface Props {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
}

/**
 * فرم ساخت کاربر.
 *
 * انتخاب شعبه فقط برای صندوقدار نمایش داده می‌شود — بک‌اند هم همین
 * قاعده را اعمال می‌کند، ولی پنهان‌کردن فیلد بی‌ربط، خطای کاربر را
 * پیش از ارسال حذف می‌کند.
 */
export function UserFormModal({ open, onClose, branches }: Props) {
  const createUser = useCreate<Record<string, string>, AdminUser>(
    '/users',
    'users',
  );

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CASHIER);
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const needsBranch = role === UserRole.CASHIER;
  const activeBranches = branches.filter((b) => b.isActive);

  function reset() {
    setFullName('');
    setUsername('');
    setPassword('');
    setRole(UserRole.CASHIER);
    setBranchId('');
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (needsBranch && !branchId) {
      setError('برای صندوقدار انتخاب شعبه الزامی است.');
      return;
    }

    try {
      await createUser.mutateAsync({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        role,
        ...(needsBranch && branchId ? { branchId } : {}),
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : 'ثبت ناموفق بود.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="افزودن کاربر">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="نام و نام خانوادگی"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoFocus
        />

        <TextInput
          label="نام کاربری"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          hint="فقط حروف لاتین، رقم، نقطه، خط تیره و زیرخط"
          ltr
          required
        />

        <TextInput
          label="رمز عبور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="حداقل ۸ کاراکتر، شامل حرف و رقم"
          ltr
          required
        />

        <SelectInput
          label="نقش"
          value={role}
          onChange={(value) => setRole(value as UserRole)}
          options={Object.values(UserRole).map((value) => ({
            value,
            label: USER_ROLE_LABELS[value],
          }))}
        />

        {needsBranch && (
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
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={createUser.isPending}>
            ثبت کاربر
          </Button>
        </div>
      </form>
    </Modal>
  );
}
