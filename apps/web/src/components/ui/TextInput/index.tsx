import clsx from 'clsx';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { buildFieldIds, FieldWrapper } from '../FieldWrapper/index';

/**
 * ورودی متنی.
 *
 * از همان `FieldWrapper` ورودی مبلغ استفاده می‌کند تا ساختار برچسب،
 * خطا و راهنما در کل سامانه یکسان بماند.
 */

interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  /** برای نام کاربری و رمز، جهت چپ‌به‌راست خواناتر است. */
  ltr?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { label, error, hint, id, ltr, required, className, ...props },
    ref,
  ) {
    const generatedId = useId();
    const ids = buildFieldIds(id ?? generatedId, Boolean(error), Boolean(hint));

    return (
      <FieldWrapper
        label={label}
        required={required}
        error={error}
        hint={hint}
        ids={ids}
        className={className}
      >
        <input
          {...props}
          ref={ref}
          id={ids.inputId}
          required={required}
          dir={ltr ? 'ltr' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={clsx(
            'w-full rounded border bg-surface px-3 py-2 transition-colors',
            'placeholder:text-text-muted',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
            ltr && 'text-left',
            error
              ? 'border-shortage focus:border-shortage'
              : 'border-border focus:border-primary',
          )}
        />
      </FieldWrapper>
    );
  },
);
