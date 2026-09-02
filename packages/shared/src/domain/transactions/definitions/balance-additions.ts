/**
 * اقلام مثبت «مانده صندوق».
 *
 * منبع: سند «cash close.docx» (پرانتز اول فرمول) و ردیف‌های متناظر در
 * فایل «صندوق (3).xlsm».
 */

import {
  FormulaSide,
  TransactionType,
  type TransactionTypeDefinition,
} from '../types.js';

export const BALANCE_ADDITIONS: readonly TransactionTypeDefinition[] = [
  {
    type: TransactionType.SALES_TOTAL,
    label: 'فروش کل',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: false,
    hasImages: true,
    isMultiRow: false,
    hint: 'جمع فروش روز در سیستم حسابداری، به‌همراه عکس صفحهٔ فروش.',
  },
  {
    type: TransactionType.CUSTOMER_REFUND,
    label: 'واریز به مشتری',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'واریز وجه جنس برگشتی به مشتری؛ نام/شمارهٔ مشتری در توضیح و عکس شمارهٔ کارت.',
  },
  {
    type: TransactionType.DEBT_RECEIPT,
    label: 'دریافت بدهی',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'مشتری در روزهای قبل خرید بدون تسویه داشته و امروز آن را پرداخت کرده است.',
  },
  {
    type: TransactionType.DEPOSIT_RECEIPT,
    label: 'دریافت بیعانه',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'مشتری کالا را نخریده ولی بابت نگهداری کالا بیعانه پرداخت کرده است.',
  },
  {
    type: TransactionType.EXPENSE_RECEIPT,
    label: 'دریافت هزینه',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'هزینهٔ جانبی دریافتی از مشتری مانند پیک، خیاطی یا سفارشی‌سازی.',
  },
  {
    type: TransactionType.CASH_SURPLUS,
    label: 'مازاد صندوق',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'مثلاً نبود پول خرد برای بازگرداندن، یا فروش پس از بستن صندوق که فردا ثبت می‌شود.',
  },
  {
    type: TransactionType.CREDIT_NOTE_ISSUED,
    label: 'صدور سند بستانکاری',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'به‌جای پرداخت نقدیِ کالای برگشتی، سند بستانکاری برای خرید بعدی صادر شده است.',
  },
  {
    type: TransactionType.CREDIT_DOC_ISSUED,
    label: 'صدور سند اعتباری',
    side: FormulaSide.BALANCE_ADD,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'مخصوص فروشگاه‌های زنجیره‌ای؛ برگشت در یک شعبه و خرید از شعبهٔ دیگر.',
  },
] as const;
