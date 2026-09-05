/**
 * شناسه‌ها و نوع‌های پایهٔ تراکنش.
 *
 * این فایل فقط «تعریف» است و هیچ داده یا منطقی ندارد — جدول اقلام در
 * پوشهٔ `definitions/` و توابع کار با آن در `registry.ts` است.
 */

/** سمت قلم در معادلهٔ صندوق. */
export const FormulaSide = {
  /** جزء مثبت «مانده صندوق». */
  BALANCE_ADD: 'balance_add',
  /** جزء منفی «مانده صندوق». */
  BALANCE_SUBTRACT: 'balance_subtract',
  /** جزء «جمع اسناد» — پول/سند واقعی موجود در صندوق. */
  DOCUMENT: 'document',
} as const;

export type FormulaSide = (typeof FormulaSide)[keyof typeof FormulaSide];

/** شناسهٔ یکتای هر نوع تراکنش (مقدار ستون `type` در دیتابیس). */
export const TransactionType = {
  // اجزای مثبت مانده صندوق
  SALES_TOTAL: 'sales_total',
  CUSTOMER_REFUND: 'customer_refund',
  DEBT_RECEIPT: 'debt_receipt',
  DEPOSIT_RECEIPT: 'deposit_receipt',
  EXPENSE_RECEIPT: 'expense_receipt',
  CASH_SURPLUS: 'cash_surplus',
  CREDIT_NOTE_ISSUED: 'credit_note_issued',
  CREDIT_DOC_ISSUED: 'credit_doc_issued',

  // اجزای منفی مانده صندوق
  BARTER: 'barter',
  CREDIT_NOTE_RECEIVED: 'credit_note_received',
  EXPENSE_PAYMENT: 'expense_payment',
  GOODS_RETURN: 'goods_return',
  CASH_SHORTAGE: 'cash_shortage',
  UNSETTLED_PURCHASE: 'unsettled_purchase',
  PRIOR_DEPOSIT: 'prior_deposit',
  VIP_DISCOUNT: 'vip_discount',

  // اجزای جمع اسناد
  CHEQUE: 'cheque',
  POS: 'pos',
  CARD_TO_CARD: 'card_to_card',
  CASH: 'cash',
  FOREIGN_CURRENCY: 'foreign_currency',
  ONLINE_GATEWAY: 'online_gateway',
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

/** تعریف کامل رفتار و UI هر قلم. */
export interface TransactionTypeDefinition {
  readonly type: TransactionType;
  /** برچسب فارسی — مطابق فایل اکسل واقعی. */
  readonly label: string;
  readonly side: FormulaSide;
  /** آیا این قلم فیلد توضیح دارد؟ (جدول راهنمای سند) */
  readonly hasDescription: boolean;
  /** آیا این قلم آپلود عکس دارد؟ (جدول راهنمای سند) */
  readonly hasImages: boolean;
  /**
   * آیا چند ردیفی است؟ چک و کارت‌به‌کارت چند رکورد دارند، ولی
   * «فروش کل» فقط یک مقدار.
   */
  readonly isMultiRow: boolean;
  /**
   * آیا ردیف به دستگاه کارتخوان وصل می‌شود؟
   *
   * فقط کارتخوان و کارت‌به‌کارت: مدیر باید بتواند بفهمد کدام دستگاه چقدر
   * فروش داشته، پس مبلغ بدون دستگاه معنای مدیریتی ندارد.
   */
  readonly needsTerminal: boolean;
  /** توضیح کسب‌وکاری برای نمایش در Tooltip راهنما. */
  readonly hint: string;
}
