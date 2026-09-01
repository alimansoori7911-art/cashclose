/**
 * موتور محاسبهٔ صندوق — تنها پیاده‌سازی فرمول در کل سیستم.
 *
 * هم بک‌اند (اعتبارسنجی قطعی پیش از بستن صندوق) و هم فرانت‌اند (نمایش
 * Real-time حین تایپ) همین تابع را صدا می‌زنند تا امکان واگرایی منطق
 * بین دو سمت وجود نداشته باشد.
 *
 * فرمول (منبع: سلول B15/B17/B18 فایل «صندوق (3).xlsm»):
 *
 *   مانده صندوق = Σ(اقلام مثبت) − Σ(اقلام منفی)
 *   جمع اسناد   = Σ(چک + کارتخوان + کارت‌به‌کارت + نقدی + ارز + درگاه)
 *   اختلاف      = جمع اسناد − مانده صندوق
 *
 *   اختلاف = ۰  → تراز  (صندوق قابل بستن)
 *   اختلاف > ۰  → مازاد (بستن غیرمجاز)
 *   اختلاف < ۰  → کسری  (بستن غیرمجاز)
 *
 * تمام مبالغ «ریال» و صحیح (integer) هستند. برای پرهیز از خطای ممیز
 * شناور در مبالغ بزرگ، محاسبات با bigint انجام و در خروجی به‌صورت
 * رشته/عدد امن ارائه می‌شود.
 */

import {
  FormulaSide,
  TransactionType,
  getTransactionType,
} from './transaction-types.js';

/** یک قلم ورودی برای محاسبه. */
export interface CalculationInput {
  readonly type: TransactionType;
  /** مبلغ به ریال؛ همیشه نامنفی. */
  readonly amount: number | bigint;
}

/** وضعیت تراز صندوق. */
export const CashStatus = {
  BALANCED: 'balanced',
  SURPLUS: 'surplus',
  SHORTAGE: 'shortage',
} as const;

export type CashStatus = (typeof CashStatus)[keyof typeof CashStatus];

export interface CashCalculationResult {
  /** مانده صندوق (ریال). */
  readonly registerBalance: bigint;
  /** جمع اسناد (ریال). */
  readonly documentsTotal: bigint;
  /** اختلاف = جمع اسناد − مانده صندوق. */
  readonly difference: bigint;
  readonly status: CashStatus;
  /** آیا صندوق قابل بستن است؟ (فقط وقتی اختلاف دقیقاً صفر باشد) */
  readonly canClose: boolean;
  /** جمع تفکیکی هر سمت — برای نمایش در باکس خلاصه. */
  readonly breakdown: {
    readonly balanceAdditions: bigint;
    readonly balanceSubtractions: bigint;
    readonly documents: bigint;
  };
  /** جمع هر نوع تراکنش — برای نمایش در کارت هر سکشن. */
  readonly totalsByType: Readonly<Record<string, bigint>>;
}

function toBigInt(amount: number | bigint): bigint {
  if (typeof amount === 'bigint') return amount;
  if (!Number.isFinite(amount)) {
    throw new Error(`مبلغ نامعتبر است: ${amount}`);
  }
  if (!Number.isInteger(amount)) {
    throw new Error(`مبلغ باید عدد صحیح باشد (ریال): ${amount}`);
  }
  return BigInt(amount);
}

/**
 * محاسبهٔ مانده صندوق، جمع اسناد و اختلاف.
 *
 * ورودی‌های با مبلغ صفر بی‌اثر ولی مجازند (صندوقدار می‌تواند کارتخوانی را
 * بدون مبلغ رها کند). مبلغ منفی خطاست — علامت هر قلم از روی `side` آن
 * تعیین می‌شود، نه از روی علامت عدد.
 */
export function calculateCashRegister(
  inputs: readonly CalculationInput[],
): CashCalculationResult {
  let balanceAdditions = 0n;
  let balanceSubtractions = 0n;
  let documents = 0n;
  const totalsByType: Record<string, bigint> = {};

  for (const input of inputs) {
    const definition = getTransactionType(input.type);
    const amount = toBigInt(input.amount);

    if (amount < 0n) {
      throw new Error(
        `مبلغ «${definition.label}» نمی‌تواند منفی باشد: ${amount}`,
      );
    }

    totalsByType[input.type] = (totalsByType[input.type] ?? 0n) + amount;

    switch (definition.side) {
      case FormulaSide.BALANCE_ADD:
        balanceAdditions += amount;
        break;
      case FormulaSide.BALANCE_SUBTRACT:
        balanceSubtractions += amount;
        break;
      case FormulaSide.DOCUMENT:
        documents += amount;
        break;
    }
  }

  const registerBalance = balanceAdditions - balanceSubtractions;
  const documentsTotal = documents;
  const difference = documentsTotal - registerBalance;

  const status: CashStatus =
    difference === 0n
      ? CashStatus.BALANCED
      : difference > 0n
        ? CashStatus.SURPLUS
        : CashStatus.SHORTAGE;

  return {
    registerBalance,
    documentsTotal,
    difference,
    status,
    canClose: difference === 0n,
    breakdown: { balanceAdditions, balanceSubtractions, documents },
    totalsByType,
  };
}

/** برچسب فارسی وضعیت تراز. */
export const CASH_STATUS_LABELS: Readonly<Record<CashStatus, string>> = {
  [CashStatus.BALANCED]: 'تراز',
  [CashStatus.SURPLUS]: 'مازاد صندوق',
  [CashStatus.SHORTAGE]: 'کسری صندوق',
};
