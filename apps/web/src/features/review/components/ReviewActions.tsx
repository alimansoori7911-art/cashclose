import { useState } from 'react';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import { ApiError } from '../../../lib/api';
import { useApprove, useReject } from '../hooks/useReviewApi';

interface Props {
  registerId: string;
  status: string;
  onDone: () => void;
}

/**
 * دکمه‌های تأیید و رد.
 *
 * رد همیشه از طریق مدال انجام می‌شود چون علت اجباری است؛ تأیید بدون
 * مدال، چون یادداشت اختیاری است و اصطکاک اضافه لازم ندارد.
 */
export function ReviewActions({ registerId, status, onDone }: Props) {
  const approve = useApprove(registerId);
  const reject = useReject(registerId);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canApprove = status === 'submitted';
  const canReject = status === 'submitted' || status === 'approved';

  async function handleApprove() {
    setError(null);
    try {
      await approve.mutateAsync(undefined);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : 'تأیید ناموفق بود.');
    }
  }

  async function handleReject() {
    setError(null);

    if (reason.trim().length < 5) {
      setError('علت رد باید حداقل ۵ کاراکتر باشد.');
      return;
    }

    try {
      await reject.mutateAsync(reason.trim());
      setReason('');
      setRejectOpen(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : 'رد صندوق ناموفق بود.');
    }
  }

  if (!canApprove && !canReject) return null;

  return (
    <div className="flex flex-col gap-3">
      {error && !rejectOpen && <Alert tone="error">{error}</Alert>}

      <div className="flex items-center gap-2.5">
        {canReject && (
          <Button
            variant="danger"
            onClick={() => {
              setError(null);
              setRejectOpen(true);
            }}
          >
            {status === 'approved' ? 'بازگرداندن و رد' : 'رد صندوق'}
          </Button>
        )}

        {canApprove && (
          <Button onClick={handleApprove} loading={approve.isPending}>
            تأیید صندوق
          </Button>
        )}
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="رد صندوق"
      >
        <div className="flex flex-col gap-4">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reject-reason"
              className="text-sm font-medium text-text"
            >
              علت رد
              <span className="text-shortage" aria-hidden>
                {' '}
                *
              </span>
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={1000}
              autoFocus
              placeholder="دقیقاً بنویسید چه چیزی باید اصلاح شود؛ این متن برای صندوقدار ارسال می‌شود."
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-text-muted">
              این توضیح به‌صورت اعلان برای صندوقدار فرستاده می‌شود.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              انصراف
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={reject.isPending}
            >
              ثبت رد
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
