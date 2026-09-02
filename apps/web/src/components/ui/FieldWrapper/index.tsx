import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * پوستهٔ مشترک فیلدهای فرم: برچسب، پیام خطا و متن راهنما.
 *
 * چرا جداست: این ساختار در همهٔ ورودی‌ها (مبلغ، متن، تاریخ، آپلود) عیناً
 * تکرار می‌شود. یکجا بودنش یعنی دسترس‌پذیری (ارتباط برچسب با ورودی و
 * aria-describedby) هم یک‌بار درست انجام شود، نه در هر کامپوننت.
 */

export interface FieldIds {
  readonly inputId: string;
  readonly hintId: string;
  readonly errorId: string;
  /** برای aria-describedby ورودی. */
  readonly describedBy: string | undefined;
}

export function buildFieldIds(baseId: string, hasError: boolean, hasHint: boolean): FieldIds {
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const describedBy =
    [hasError ? errorId : null, hasHint ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return { inputId: baseId, hintId, errorId, describedBy };
}

interface FieldWrapperProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  ids: FieldIds;
  className?: string;
  children: ReactNode;
}

export function FieldWrapper({
  label,
  required,
  error,
  hint,
  ids,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={ids.inputId} className="text-sm font-medium text-text">
          {label}
          {required && (
            <span className="text-shortage" aria-hidden>
              {' '}
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <p id={ids.errorId} role="alert" className="text-sm text-shortage">
          {error}
        </p>
      ) : (
        hint && (
          <p id={ids.hintId} className="text-sm text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
