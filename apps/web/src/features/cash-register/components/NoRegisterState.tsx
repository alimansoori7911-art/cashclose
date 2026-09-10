import { formatJalaliLong } from '@cashclose/shared';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { useDateChoice } from '../hooks/useDateChoice';

export interface CreateRegisterOptions {
  businessDate: string;
  isTwoDay: boolean;
  coversUntilDate?: string;
}

/**
 * حالت «هنوز صندوقی ساخته نشده».
 *
 * انتخاب تاریخ اینجاست چون بند ۱۱.۱ سند فقط امروز یا دیروز را مجاز
 * می‌داند: صندوقدار که دیروز صندوق را نبسته، باید بتواند همان دیروز را
 * ثبت کند یا هر دو روز را یکجا ببندد.
 */
export function NoRegisterState({
  onCreate,
  creating,
  error,
}: {
  onCreate: (options: CreateRegisterOptions) => void | Promise<void>;
  creating: boolean;
  error: string | null;
}) {
  const date = useDateChoice();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-center text-xl font-bold text-text">
        صندوق روزانه
      </h1>
      <p className="mb-5 text-center text-sm text-text-muted">
        هنوز صندوق بازی ندارید. تاریخ صندوق را انتخاب کنید.
      </p>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <fieldset className="mb-4 rounded-lg border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-medium text-text">
          تاریخ صندوق
        </legend>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {date.options.map((option) => (
            <DateChoice
              key={option.iso}
              checked={date.businessDate === option.iso}
              onSelect={() => date.select(option.iso)}
              label={option.label}
            />
          ))}
        </div>

        {date.twoDayAvailable && (
          <label className="mt-3 flex cursor-pointer items-start gap-2 border-t border-border pt-3">
            <input
              type="checkbox"
              checked={date.isTwoDay}
              onChange={(event) => date.setTwoDay(event.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="text-sm text-text">
              بستن این روز و روز بعدش با هم
              <span className="mt-0.5 block text-xs text-text-muted">
                یک صندوق برای هر دو روز ثبت می‌شود و اقلام هر دو روز با هم
                تراز می‌شوند.
              </span>
            </span>
          </label>
        )}
      </fieldset>

      {date.coversUntil && (
        <Alert tone="info" className="mb-4">
          این صندوق {formatJalaliLong(date.businessDate)} تا{' '}
          {formatJalaliLong(date.coversUntil)} را پوشش می‌دهد.
        </Alert>
      )}

      <div className="text-center">
        <Button
          loading={creating}
          onClick={() =>
            onCreate({
              businessDate: date.businessDate,
              isTwoDay: date.twoDayActive,
              ...(date.coversUntil
                ? { coversUntilDate: date.coversUntil }
                : {}),
            })
          }
        >
          {date.twoDayActive ? 'ایجاد صندوق دوروزه' : 'ایجاد صندوق'}
        </Button>
      </div>
    </div>
  );
}

/** یک گزینهٔ تاریخ. */
function DateChoice({
  checked,
  onSelect,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <label
      className={[
        'flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors',
        checked
          ? 'border-primary bg-primary-soft text-text'
          : 'border-border text-text-muted hover:border-primary',
      ].join(' ')}
    >
      <input
        type="radio"
        name="business-date"
        checked={checked}
        onChange={onSelect}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}
