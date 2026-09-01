/**
 * نقش‌ها و وضعیت‌های سیستم.
 *
 * `UserRole` عمداً به‌صورت enum رشته‌ای تعریف شده تا افزودن نقش
 * `SUPER_ADMIN` در فاز بعدی (Billing/پنل پلتفرم) فقط یک مقدار جدید
 * باشد و Migration مخربی لازم نشود.
 */

export const UserRole = {
  CASHIER: 'cashier',
  ACCOUNTANT: 'accountant',
  STORE_MANAGER: 'store_manager',
  FINANCIAL_MANAGER: 'financial_manager',
  OWNER: 'owner',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_LABELS: Readonly<Record<UserRole, string>> = {
  [UserRole.CASHIER]: 'صندوقدار',
  [UserRole.ACCOUNTANT]: 'حسابدار',
  [UserRole.STORE_MANAGER]: 'مدیر فروشگاه',
  [UserRole.FINANCIAL_MANAGER]: 'مدیر مالی',
  [UserRole.OWNER]: 'مالک',
};

/** چرخهٔ حیات صندوق روزانه. */
export const CashRegisterStatus = {
  /** در حال ثبت توسط صندوقدار؛ قابل ویرایش. */
  DRAFT: 'draft',
  /** بسته و ارسال‌شده برای حسابدار؛ برای صندوقدار قفل است. */
  SUBMITTED: 'submitted',
  /** تأیید حسابدار. */
  APPROVED: 'approved',
  /** ردشده؛ به صندوقدار بازگشته و دوباره قابل ویرایش است. */
  REJECTED: 'rejected',
} as const;

export type CashRegisterStatus =
  (typeof CashRegisterStatus)[keyof typeof CashRegisterStatus];

export const CASH_REGISTER_STATUS_LABELS: Readonly<
  Record<CashRegisterStatus, string>
> = {
  [CashRegisterStatus.DRAFT]: 'پیش‌نویس',
  [CashRegisterStatus.SUBMITTED]: 'در انتظار بررسی',
  [CashRegisterStatus.APPROVED]: 'تأییدشده',
  [CashRegisterStatus.REJECTED]: 'ردشده',
};

/** وضعیت‌هایی که صندوقدار در آن‌ها اجازهٔ ویرایش دارد. */
export const EDITABLE_STATUSES: readonly CashRegisterStatus[] = [
  CashRegisterStatus.DRAFT,
  CashRegisterStatus.REJECTED,
];

/**
 * وضعیت‌هایی که «باز» محسوب می‌شوند و مانع ساخت صندوق جدید هستند.
 * منبع: بخش ۱۱.۱ سند PRD.
 */
export const OPEN_STATUSES: readonly CashRegisterStatus[] = [
  CashRegisterStatus.DRAFT,
  CashRegisterStatus.SUBMITTED,
  CashRegisterStatus.REJECTED,
];

export function isEditableByCashier(status: CashRegisterStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function isOpenStatus(status: CashRegisterStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
