import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * دکمهٔ پایه.
 *
 * حالت `loading` دکمه را غیرفعال هم می‌کند تا ارسال دوباره (double
 * submit) ممکن نباشد — در فرم‌هایی مثل بستن صندوق این یعنی جلوگیری از
 * ثبت تکراری.
 */

type Variant = 'primary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover disabled:bg-surface-muted disabled:text-text-muted',
  ghost:
    'bg-surface border border-border text-text hover:bg-surface-muted disabled:text-text-muted',
  danger:
    'bg-shortage text-white hover:opacity-90 disabled:bg-surface-muted disabled:text-text-muted',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded px-4 py-2.5',
        'text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        VARIANTS[variant],
        className,
      )}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
