/** نوع‌های ورودی و خروجی موتور محاسبهٔ صندوق. */

import type { TransactionType } from '../transactions/index.js';

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

export const CASH_STATUS_LABELS: Readonly<Record<CashStatus, string>> = {
  [CashStatus.BALANCED]: 'تراز',
  [CashStatus.SURPLUS]: 'مازاد صندوق',
  [CashStatus.SHORTAGE]: 'کسری صندوق',
};

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
