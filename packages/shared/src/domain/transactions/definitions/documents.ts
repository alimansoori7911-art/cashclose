/**
 * اقلام «جمع اسناد» — پول و اسناد واقعی موجود در صندوق.
 *
 * منبع: سلول B18 فایل «صندوق (3).xlsm»:
 *   جمع اسناد = چک + کارتخوان‌ها + کارت‌به‌کارت + نقدی + ارز + درگاه اینترنتی
 *
 * ترتیب این آرایه با ترتیب سند یکسان است و یک تست خودکار آن را تثبیت
 * می‌کند تا جابه‌جایی تصادفی رخ ندهد.
 */

import {
  FormulaSide,
  TransactionType,
  type TransactionTypeDefinition,
} from '../types.js';

export const DOCUMENT_ITEMS: readonly TransactionTypeDefinition[] = [
  {
    type: TransactionType.CHEQUE,
    label: 'چک‌های دریافتی',
    side: FormulaSide.DOCUMENT,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'چک‌های دریافتی از مشتریان؛ برای هر چک عکس جداگانه قابل بارگذاری است.',
  },
  {
    type: TransactionType.POS,
    label: 'کارتخوان‌ها',
    side: FormulaSide.DOCUMENT,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'مبلغ هر دستگاه کارتخوان به تفکیک، به‌همراه عکس رسید پایان روز هر دستگاه.',
  },
  {
    type: TransactionType.CARD_TO_CARD,
    label: 'واریز کارت به کارت',
    side: FormulaSide.DOCUMENT,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'واریزهای کارت‌به‌کارت؛ شمارهٔ کارت مقصد و عکس رسید.',
  },
  {
    type: TransactionType.CASH,
    label: 'نقدی',
    side: FormulaSide.DOCUMENT,
    hasDescription: false,
    hasImages: false,
    isMultiRow: false,
    hint: 'مجموع وجه نقد شمرده‌شده در صندوق.',
  },
  {
    type: TransactionType.FOREIGN_CURRENCY,
    label: 'ارز (به ریال)',
    side: FormulaSide.DOCUMENT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'ارز دریافتی؛ مبلغ معادل ریالی وارد و نوع/مبلغ ارز در توضیح نوشته می‌شود.',
  },
  {
    type: TransactionType.ONLINE_GATEWAY,
    label: 'درگاه فروش اینترنتی',
    side: FormulaSide.DOCUMENT,
    hasDescription: false,
    hasImages: false,
    isMultiRow: false,
    hint: 'مجموع فروش از طریق درگاه پرداخت اینترنتی.',
  },
] as const;
