import { formatJalaliLong, type CashRegisterStatus } from '@cashclose/shared';

import { Alert } from '../../../components/ui/Alert/index';
import { RegisterStatusBadge } from '../../../components/ui/StatusBadge/index';

interface Props {
  businessDate: string;
  /** روز دوم صندوق دوروزه؛ `null` یعنی صندوق یک‌روزه است. */
  coversUntil: string | null;
  branchName: string;
  status: CashRegisterStatus;
  readOnly: boolean;
  error: string | null;
  notice: string | null;
}

/** سربرگ صفحهٔ صندوق و پیام‌های وضعیت آن. */
export function RegisterHeader({
  businessDate,
  coversUntil,
  branchName,
  status,
  readOnly,
  error,
  notice,
}: Props) {
  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text">ثبت و بستن صندوق</h1>
          <p className="mt-1 text-sm text-text-muted">
            {coversUntil ? (
              <>
                {formatJalaliLong(businessDate)} تا{' '}
                {formatJalaliLong(coversUntil)}
              </>
            ) : (
              formatJalaliLong(businessDate)
            )}{' '}
            — {branchName}
          </p>
        </div>
        <RegisterStatusBadge status={status} />
      </header>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {notice && (
        <Alert tone="success" className="mb-4">
          {notice}
        </Alert>
      )}

      {coversUntil && (
        <Alert tone="info" className="mb-4">
          صندوق دوروزه: اقلام {formatJalaliLong(businessDate)} و{' '}
          {formatJalaliLong(coversUntil)} با هم در همین فرم ثبت و یکجا تراز
          می‌شوند.
        </Alert>
      )}

      {readOnly && (
        <Alert tone="info" className="mb-4">
          این صندوق بسته شده و تا بررسی حسابدار قابل ویرایش نیست.
        </Alert>
      )}
    </>
  );
}
