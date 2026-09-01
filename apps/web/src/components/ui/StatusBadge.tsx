import {
  CASH_REGISTER_STATUS_LABELS,
  CASH_STATUS_LABELS,
  CashRegisterStatus,
  CashStatus,
} from '@cashclose/shared';
import clsx from 'clsx';

/**
 * نشان وضعیت.
 *
 * دو کاربرد دارد: وضعیت تراز صندوق (تراز/مازاد/کسری) و وضعیت گردش‌کار
 * (پیش‌نویس/در انتظار/تأیید/رد).
 *
 * رنگ تنها حامل معنا نیست — متن همیشه کنار رنگ می‌آید تا برای کاربران
 * دارای اختلال تشخیص رنگ هم خوانا بماند.
 */

type Tone = 'balanced' | 'surplus' | 'shortage' | 'warning' | 'neutral' | 'primary';

const TONE_CLASSES: Record<Tone, string> = {
  balanced: 'bg-balanced-soft text-balanced',
  surplus: 'bg-surplus-soft text-surplus',
  shortage: 'bg-shortage-soft text-shortage',
  warning: 'bg-warning-soft text-warning',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-surface-muted text-text-muted',
};

const CASH_STATUS_TONE: Record<CashStatus, Tone> = {
  [CashStatus.BALANCED]: 'balanced',
  [CashStatus.SURPLUS]: 'surplus',
  [CashStatus.SHORTAGE]: 'shortage',
};

const REGISTER_STATUS_TONE: Record<CashRegisterStatus, Tone> = {
  [CashRegisterStatus.DRAFT]: 'neutral',
  [CashRegisterStatus.SUBMITTED]: 'warning',
  [CashRegisterStatus.APPROVED]: 'balanced',
  [CashRegisterStatus.REJECTED]: 'shortage',
};

interface BadgeProps {
  label: string;
  tone: Tone;
  className?: string;
}

function Badge({ label, tone, className }: BadgeProps) {
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

/** وضعیت تراز صندوق: تراز (سبز) / مازاد (آبی) / کسری (قرمز). */
export function CashStatusBadge({
  status,
  className,
}: {
  status: CashStatus;
  className?: string;
}) {
  return (
    <Badge
      label={CASH_STATUS_LABELS[status]}
      tone={CASH_STATUS_TONE[status]}
      className={className}
    />
  );
}

/** وضعیت گردش‌کار صندوق. */
export function RegisterStatusBadge({
  status,
  className,
}: {
  status: CashRegisterStatus;
  className?: string;
}) {
  return (
    <Badge
      label={CASH_REGISTER_STATUS_LABELS[status]}
      tone={REGISTER_STATUS_TONE[status]}
      className={className}
    />
  );
}
