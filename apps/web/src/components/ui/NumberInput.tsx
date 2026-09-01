import { formatMoneyLatin, MAX_AMOUNT, parseMoney } from '@cashclose/shared';
import clsx from 'clsx';
import { forwardRef, useId, useState } from 'react';

/**
 * ورودی مبلغ ریالی.
 *
 * رفتار:
 *  • حین تایپ جداکنندهٔ هزارگان اضافه می‌شود («1,250,000»).
 *  • ارقام فارسی/عربی خودکار به لاتین تبدیل می‌شوند (کیبورد فارسی).
 *  • فقط عدد نامنفی و حداکثر ۹ رقم — طبق بند ۹.۷ سند.
 *  • مقدار به بیرون همیشه `number` خام است، نه رشتهٔ قالب‌بندی‌شده.
 *
 * از `type="text"` با `inputMode="numeric"` استفاده می‌کنیم چون
 * `type="number"` اجازهٔ نمایش جداکننده را نمی‌دهد.
 */

interface NumberInputProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      label,
      value,
      onChange,
      placeholder = '۰',
      disabled,
      error,
      hint,
      required,
      className,
      id,
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    // متن خام حین تایپ نگه داشته می‌شود تا حالت‌های میانی (مثلاً فیلد
    // خالی‌شده) باعث پرش مکان‌نما یا بازگشت ناگهانی مقدار نشوند.
    const [draft, setDraft] = useState<string | null>(null);

    const display =
      draft ?? (value === null ? '' : formatMoneyLatin(value));

    function handleChange(raw: string) {
      if (raw.trim() === '') {
        setDraft('');
        onChange(null);
        return;
      }

      const parsed = parseMoney(raw);
      if (parsed === null) {
        // ورودی نامعتبر (حرف، مقدار بیش از سقف) نادیده گرفته می‌شود تا
        // کاربر نتواند حالت غیرمجاز بسازد.
        return;
      }

      setDraft(formatMoneyLatin(parsed));
      onChange(parsed);
    }

    return (
      <div className={clsx('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
            {required && (
              <span className="text-shortage" aria-hidden>
                {' '}
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            value={display}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null]
                .filter(Boolean)
                .join(' ') || undefined
            }
            onChange={(event) => handleChange(event.target.value)}
            onBlur={() => setDraft(null)}
            className={clsx(
              // ورودی dir="ltr" است، پس واحد «ریال» در سمت چپ فیزیکی قرار
              // می‌گیرد؛ padding فیزیکی (نه منطقی) لازم است تا با ارقام
              // تداخل نکند.
              'financial-figure w-full rounded border bg-surface py-2 pl-14 pr-3 text-left',
              'transition-colors placeholder:text-text-muted',
              'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
              error
                ? 'border-shortage focus:border-shortage'
                : 'border-border focus:border-primary',
            )}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-muted"
          >
            ریال
          </span>
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-sm text-shortage">
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="text-sm text-text-muted">
              {hint}
            </p>
          )
        )}
      </div>
    );
  },
);

export { MAX_AMOUNT };
