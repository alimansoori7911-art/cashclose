import { useId } from 'react';

import { buildFieldIds, FieldWrapper } from '../FieldWrapper/index';

/**
 * انتخاب‌گر تک‌مقداری.
 *
 * از همان `FieldWrapper` ورودی‌های دیگر استفاده می‌کند تا ساختار
 * برچسب، خطا و راهنما در کل فرم‌ها یکسان بماند.
 */

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** گزینهٔ خالی ابتدای فهرست؛ برای فیلدهای اجباری مفید است. */
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
  hint,
  disabled,
  id,
}: SelectInputProps) {
  const generatedId = useId();
  const ids = buildFieldIds(id ?? generatedId, Boolean(error), Boolean(hint));

  return (
    <FieldWrapper
      label={label}
      required={required}
      error={error}
      hint={hint}
      ids={ids}
    >
      <select
        id={ids.inputId}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={[
          'w-full rounded border bg-surface px-3 py-2 text-text transition-colors',
          'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
          error
            ? 'border-shortage focus:border-shortage'
            : 'border-border focus:border-primary',
        ].join(' ')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
