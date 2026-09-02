import clsx from 'clsx';
import { forwardRef, useId } from 'react';

import { buildFieldIds, FieldWrapper } from '../FieldWrapper/index';
import { useNumberInput } from './useNumberInput';

/**
 * ورودی مبلغ ریالی.
 *
 * از `type="text"` با `inputMode="numeric"` استفاده می‌کند چون
 * `type="number"` اجازهٔ نمایش جداکنندهٔ هزارگان را نمی‌دهد.
 * منطق تبدیل و اعتبارسنجی در `useNumberInput` است.
 */

export interface NumberInputProps {
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
    const ids = buildFieldIds(id ?? generatedId, Boolean(error), Boolean(hint));
    const { displayValue, handleChange, handleBlur } = useNumberInput(
      value,
      onChange,
    );

    return (
      <FieldWrapper
        label={label}
        required={required}
        error={error}
        hint={hint}
        ids={ids}
        className={className}
      >
        <div className="relative">
          <input
            ref={ref}
            id={ids.inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            value={displayValue}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={ids.describedBy}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={handleBlur}
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
      </FieldWrapper>
    );
  },
);
