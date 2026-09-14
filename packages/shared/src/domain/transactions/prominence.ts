import { FormulaSide } from './types.js';
import { TransactionType } from './types.js';
import { getTransactionType } from './registry.js';

/**
 * تفکیک اقلام پرکاربرد از نادر.
 *
 * اندازه‌گیری روی صندوق‌های واقعی نشان داد چهار قلم در ۹۷٪ صندوق‌ها پر
 * می‌شوند و بقیه تقریباً هیچ‌وقت. نمایش هم‌وزن ۲۲ قلم یعنی صندوقدار هر
 * روز از میان چیزهایی رد می‌شود که به کارش نمی‌آید.
 *
 * قلم نادر حذف نمی‌شود — فقط پشت یک بازکننده می‌رود.
 */
export const PRIMARY_TYPES: readonly TransactionType[] = [
  TransactionType.SALES_TOTAL,
  TransactionType.GOODS_RETURN,
  TransactionType.POS,
  TransactionType.CASH,
];

export function isPrimaryType(type: TransactionType): boolean {
  return PRIMARY_TYPES.includes(type);
}

/**
 * اقلامی که **کسری** را جبران می‌کنند.
 *
 * کسری یعنی جمع اسناد کمتر از مانده صندوق است؛ پس یا قلم منفیِ مانده جا
 * افتاده یا سندی ثبت نشده. این فهرست حدس نیست — از جهت ریاضی اختلاف
 * می‌آید.
 */
export const SHORTAGE_CANDIDATES: readonly TransactionType[] = [
  TransactionType.UNSETTLED_PURCHASE,
  TransactionType.CASH_SHORTAGE,
  TransactionType.VIP_DISCOUNT,
  TransactionType.BARTER,
  TransactionType.PRIOR_DEPOSIT,
];

/** اقلامی که **مازاد** را جبران می‌کنند. */
export const SURPLUS_CANDIDATES: readonly TransactionType[] = [
  TransactionType.DEBT_RECEIPT,
  TransactionType.DEPOSIT_RECEIPT,
  TransactionType.CASH_SURPLUS,
  TransactionType.EXPENSE_RECEIPT,
];

/**
 * اقلام پیشنهادی برای رفع اختلاف.
 *
 * `difference = جمع اسناد − مانده صندوق`، پس منفی یعنی کسری.
 * اقلامی که صندوقدار از قبل پر کرده کنار گذاشته می‌شوند تا فهرست کوتاه
 * و مرتبط بماند.
 */
export function suggestForDifference(
  difference: number,
  alreadyFilled: readonly TransactionType[],
): TransactionType[] {
  if (difference === 0) return [];

  const pool =
    difference < 0 ? SHORTAGE_CANDIDATES : SURPLUS_CANDIDATES;

  return pool.filter((type) => !alreadyFilled.includes(type));
}

/**
 * خطاهای ثبتی که قلم مالی نیستند — فقط باید بررسی شوند.
 *
 * این دو حالت شایع‌اند ولی **قلم اضافه نمی‌خواهند**؛ صندوقدار باید برود
 * عددی را که جا انداخته درست کند. جهتشان مخالف هم است، پس هرکدام فقط
 * در سمت خودش نشان داده می‌شود:
 *
 *   کسری → پول هست ولی ثبت نشده (کارت کشیده، مبلغش را وارد نکرده)
 *   مازاد → ثبت هست ولی پول نیست (مبلغ را نوشته، کارت نکشیده)
 */
export interface ProcessCheck {
  readonly title: string;
  readonly detail: string;
}

const SHORTAGE_CHECKS: readonly ProcessCheck[] = [
  {
    title: 'کارت کشیده شده ولی مبلغش ثبت نشده',
    detail:
      'رسید پایان روز هر دستگاه را با مبلغی که وارد کرده‌اید مقایسه کنید.',
  },
];

const SURPLUS_CHECKS: readonly ProcessCheck[] = [
  {
    title: 'مبلغ ثبت شده ولی کارت کشیده نشده',
    detail:
      'اگر تراکنشی روی دستگاه انجام نشده، پیش از بستن صندوق آن را انجام دهید.',
  },
];

/** بررسی‌های فرایندی متناسب با جهت اختلاف. */
export function processChecksFor(difference: number): ProcessCheck[] {
  if (difference === 0) return [];
  return [...(difference < 0 ? SHORTAGE_CHECKS : SURPLUS_CHECKS)];
}

/** ترتیب نمایش: اقلام پرکاربرد اول، بعد بقیه با ترتیب سند. */
export function sortByProminence(
  types: readonly TransactionType[],
): TransactionType[] {
  return [...types].sort((a, b) => {
    const diff = Number(isPrimaryType(b)) - Number(isPrimaryType(a));
    if (diff !== 0) return diff;
    return 0;
  });
}

/** اقلام یک سمت معادله، تفکیک‌شده به پرکاربرد و نادر. */
export function splitBySide(
  types: readonly TransactionType[],
  side: FormulaSide | FormulaSide[],
): { primary: TransactionType[]; secondary: TransactionType[] } {
  const sides = Array.isArray(side) ? side : [side];
  const onSide = types.filter((type) =>
    sides.includes(getTransactionType(type).side),
  );

  return {
    primary: onSide.filter(isPrimaryType),
    secondary: onSide.filter((type) => !isPrimaryType(type)),
  };
}
