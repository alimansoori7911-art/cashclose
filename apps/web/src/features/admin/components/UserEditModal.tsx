import { USER_ROLE_LABELS, UserRole } from '@cashclose/shared';
import { useEffect, useState, type FormEvent } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { SelectInput } from '../../../components/ui/SelectInput/index';
import { TextInput } from '../../../components/ui/TextInput/index';
import { ApiError } from '../../../lib/api';
import { useUpdate, type AdminUser, type Branch } from '../hooks/useAdminData';

interface Props {
  user: AdminUser;
  branches: Branch[];
  onClose: () => void;
}

/**
 * ویرایش کاربر.
 *
 * از فرم ساخت جداست چون فیلدهایش فرق دارد: نام کاربری قابل تغییر نیست
 * (شناسهٔ ورود است و تغییرش کاربر را قفل می‌کند)، رمز مسیر جداگانه دارد،
 * و وضعیت فقط اینجا معنا پیدا می‌کند.
 */
export function UserEditModal({ user, branches, onClose }: Props) {
  const updateUser = useUpdate<Record<string, string>, AdminUser>(
    (id) => `/users/${id}`,
    'users',
  );

  const [fullName, setFullName] = useState(user.fullName);
  const [role, setRole] = useState(user.role as UserRole);
  const [status, setStatus] = useState(user.status);
  const [branchId, setBranchId] = useState(user.branchId ?? '');
  const [error, setError] = useState<string | null>(null);

  // با تعویض کاربرِ در حال ویرایش، فرم باید مقدارهای تازه بگیرد.
  useEffect(() => {
    setFullName(user.fullName);
    setRole(user.role as UserRole);
    setStatus(user.status);
    setBranchId(user.branchId ?? '');
    setError(null);
  }, [user]);

  const needsBranch = role === UserRole.CASHIER;
  const activeBranches = branches.filter((b) => b.isActive);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (needsBranch && !branchId) {
      setError('برای صندوقدار انتخاب شعبه الزامی است.');
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: user.id,
        body: {
          fullName: fullName.trim(),
          role,
          status,
          // نقش ستادی شعبه ندارد؛ فرستادن شعبهٔ قبلی، داده را ناسازگار
          // می‌کرد.
          ...(needsBranch && branchId ? { branchId } : {}),
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
    <Modal open onClose={onClose} title={`ویرایش ${user.fullName}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <TextInput
          label="نام کاربری"
          value={user.username}
          onChange={() => undefined}
          hint="نام کاربری پس از ساخت قابل تغییر نیست."
          ltr
          disabled
        />

        <TextInput
          label="نام و نام خانوادگی"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoFocus
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

        <SelectInput
          label="وضعیت"
          value={status}
          onChange={setStatus}
          hint="کاربر غیرفعال نمی‌تواند وارد شود، ولی سوابقش می‌ماند."
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
          ]}
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
          <Button type="submit" loading={updateUser.isPending}>
            ذخیرهٔ تغییرات
          </Button>
        </div>
      </form>
    </Modal>
  );
}
