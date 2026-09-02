import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * پیام وضعیت.
 *
 * پیام خطا با `role="alert"` اعلام می‌شود تا صفحه‌خوان بلافاصله آن را
 * بخواند — برای کاربری که با کیبورد فرم را پر می‌کند حیاتی است.
 */

type Tone = 'error' | 'success' | 'warning' | 'info';

const TONES: Record<Tone, string> = {
  error: 'bg-shortage-soft text-shortage',
  success: 'bg-balanced-soft text-balanced',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-primary-soft text-primary',
};

interface AlertProps {
  tone: Tone;
  children: ReactNode;
  className?: string;
}

export function Alert({ tone, children, className }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'rounded px-3.5 py-2.5 text-sm',
        TONES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
