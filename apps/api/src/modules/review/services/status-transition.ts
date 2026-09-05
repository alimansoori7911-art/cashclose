import { CashRegisterStatus, NotificationType } from '@prisma/client';

/**
 * تفاوت‌های دو گذارِ «تأیید» و «رد».
 *
 * هر دو یک الگو دارند: تغییر وضعیت، ثبت در تاریخچه، اعلان به صندوقدار و
 * ثبت در لاگ عملیات. جدا کردن تفاوت‌ها در یک جدول، بدنهٔ مشترک را یک‌بار
 * می‌نویسد و از واگرا شدن این دو مسیر جلوگیری می‌کند.
 */
export interface TransitionSpec {
  status: CashRegisterStatus;
  notificationType: NotificationType;
  auditAction: string;
  /** فیلد زمانی که پر می‌شود؛ فیلد دیگر خالی می‌گردد. */
  timestampField: 'approvedAt' | 'rejectedAt';
  successMessage: string;
}

export const APPROVE: TransitionSpec = {
  status: CashRegisterStatus.approved,
  notificationType: NotificationType.cash_register_approved,
  auditAction: 'cash_register_approved',
  timestampField: 'approvedAt',
  successMessage: 'صندوق تأیید شد.',
};

export const REJECT: TransitionSpec = {
  status: CashRegisterStatus.rejected,
  notificationType: NotificationType.cash_register_rejected,
  auditAction: 'cash_register_rejected',
  timestampField: 'rejectedAt',
  successMessage: 'صندوق رد و برای اصلاح به صندوقدار بازگردانده شد.',
};

/**
 * مقادیر دو فیلد زمانی.
 *
 * فیلد مخالف صریحاً `null` می‌شود: صندوقی که رد شده نباید تاریخ تأیید
 * قبلی‌اش باقی بماند، وگرنه گزارش‌ها دو تاریخ متناقض نشان می‌دهند.
 */
export function timestamps(
  spec: TransitionSpec,
  now: Date,
): { approvedAt: Date | null; rejectedAt: Date | null } {
  return spec.timestampField === 'approvedAt'
    ? { approvedAt: now, rejectedAt: null }
    : { approvedAt: null, rejectedAt: now };
}
