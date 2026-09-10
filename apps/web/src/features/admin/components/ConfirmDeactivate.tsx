import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';

interface Props {
  title: string;
  name: string;
  note: string;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * تأیید غیرفعال‌سازی.
 *
 * غیرفعال‌سازی داده را پاک نمی‌کند، ولی دسترسی را قطع می‌کند — پس
 * تأیید صریح می‌خواهد تا با یک کلیک اشتباه رخ ندهد.
 */
export function ConfirmDeactivate({
  title,
  name,
  note,
  pending,
  error,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal open onClose={onCancel} title={title}>
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <p className="text-sm text-text">
        آیا «{name}» غیرفعال شود؟
      </p>
      <p className="mt-2 text-sm text-text-muted">{note}</p>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          انصراف
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={pending}>
          غیرفعال‌سازی
        </Button>
      </div>
    </Modal>
  );
}
