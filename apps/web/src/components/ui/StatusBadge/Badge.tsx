import clsx from 'clsx';

/**
 * نشان پایه.
 *
 * قاعدهٔ دسترس‌پذیری: رنگ هرگز تنها حامل معنا نیست — متن همیشه کنار رنگ
 * می‌آید تا برای کاربران دارای اختلال تشخیص رنگ هم خوانا بماند.
 */

export type BadgeTone =
  | 'balanced'
  | 'surplus'
  | 'shortage'
  | 'warning'
  | 'neutral'
  | 'primary';

const TONE_CLASSES: Record<BadgeTone, string> = {
  balanced: 'bg-balanced-soft text-balanced',
  surplus: 'bg-surplus-soft text-surplus',
  shortage: 'bg-shortage-soft text-shortage',
  warning: 'bg-warning-soft text-warning',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-surface-muted text-text-muted',
};

export interface BadgeProps {
  label: string;
  tone: BadgeTone;
  className?: string;
}

export function Badge({ label, tone, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
