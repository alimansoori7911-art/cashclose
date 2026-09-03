import { formatJalaliLong, todayIso } from '@cashclose/shared';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';

/** حالت «هنوز صندوقی برای امروز ساخته نشده». */
export function NoRegisterState({
  onCreate,
  creating,
  error,
}: {
  onCreate: () => void;
  creating: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="mb-2 text-xl font-bold text-text">صندوق روزانه</h1>
      <p className="mb-5 text-sm text-text-muted">
        برای {formatJalaliLong(todayIso())} هنوز صندوقی ایجاد نشده است.
      </p>

      {error && (
        <Alert tone="error" className="mb-4 text-right">
          {error}
        </Alert>
      )}

      <Button onClick={onCreate} loading={creating}>
        ایجاد صندوق امروز
      </Button>
    </div>
  );
}
