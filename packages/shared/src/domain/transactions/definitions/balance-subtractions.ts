/**
 * اقلام منفی «مانده صندوق».
 *
 * منبع: سند «cash close.docx» (پرانتز دوم فرمول) و ردیف‌های متناظر در
 * فایل «صندوق (3).xlsm».
 *
 * توجه: «برگشت کالا» اینجاست و با «واریز به مشتری» (که مثبت است) دو قلم
 * جدا هستند — هم در اکسل واقعی و هم در جدول راهنمای سند جداگانه آمده‌اند.
 */

import {
  FormulaSide,
  TransactionType,
  type TransactionTypeDefinition,
} from '../types.js';

export const BALANCE_SUBTRACTIONS: readonly TransactionTypeDefinition[] = [
  {
    type: TransactionType.BARTER,
    label: 'تهاتر',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    needsTerminal: false,
    hint: 'مشتری جنسی آورده و فروخته و با مابه‌التفاوت آن جنس دیگری خریده است؛ شمارهٔ فاکتور در توضیح.',
  },
  {
    type: TransactionType.CREDIT_NOTE_RECEIVED,
    label: 'دریافت سند بستانکاری',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    needsTerminal: false,
    hint: 'مشتری وجه را در شعبهٔ دیگری پرداخت کرده و اکنون نیازی به پرداخت مجدد نیست.',
  },
  {
    type: TransactionType.EXPENSE_PAYMENT,
    label: 'پرداخت هزینه',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    needsTerminal: false,
    hint: 'پرداخت هزینه بابت انجام سرویسی که وجه آن از مشتری دریافت شده است.',
  },
  {
    type: TransactionType.GOODS_RETURN,
    label: 'برگشت کالا',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: false,
    hasImages: true,
    isMultiRow: false,
    needsTerminal: false,
    hint: 'مبلغ برگشت کالا ثبت‌شده در سیستم حسابداری.',
  },
  {
    type: TransactionType.CASH_SHORTAGE,
    label: 'کسری صندوق',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    needsTerminal: false,
    hint: 'قرینهٔ مازاد صندوقِ روز قبل، یا هر دلیل موجه دیگر با تأیید کارفرما.',
  },
  {
    type: TransactionType.UNSETTLED_PURCHASE,
    label: 'خرید بدون تسویه',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    needsTerminal: false,
    hint: 'مشتری خرید کرده ولی قرار است وجه آن را بعداً واریز کند.',
  },
  {
    type: TransactionType.PRIOR_DEPOSIT,
    label: 'بیعانه از قبل',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    needsTerminal: false,
    hint: 'بخشی از وجه که پیش‌تر به‌عنوان بیعانه دریافت شده و امروز از مبلغ کل کسر می‌شود.',
  },
  {
    type: TransactionType.VIP_DISCOUNT,
    label: 'تخفیف VIP',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    needsTerminal: false,
    hint: 'تخفیف خارج از سیستم حسابداری که امکان ثبت آن در نرم‌افزار حسابداری وجود نداشته است.',
  },
] as const;
