import {
  CASH_REGISTER_STATUS_LABELS,
  CASH_STATUS_LABELS,
  CashRegisterStatus,
  CashStatus,
} from '@cashclose/shared';

import { Badge, type BadgeTone } from './Badge';

/**
 * نشان‌های وضعیت.
 *
 * دو مفهوم جدا: وضعیت تراز صندوق (تراز/مازاد/کسری) و وضعیت گردش‌کار
 * (پیش‌نویس/در انتظار/تأیید/رد). برچسب‌ها از بستهٔ shared می‌آیند تا با
 * بک‌اند یکسان بمانند.
 */

const CASH_STATUS_TONE: Record<CashStatus, BadgeTone> = {
  [CashStatus.BALANCED]: 'balanced',
  [CashStatus.SURPLUS]: 'surplus',
  [CashStatus.SHORTAGE]: 'shortage',
};

const REGISTER_STATUS_TONE: Record<CashRegisterStatus, BadgeTone> = {
  [CashRegisterStatus.DRAFT]: 'neutral',
  [CashRegisterStatus.SUBMITTED]: 'warning',
  [CashRegisterStatus.APPROVED]: 'balanced',
  [CashRegisterStatus.REJECTED]: 'shortage',
};

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

export { Badge, type BadgeTone };
