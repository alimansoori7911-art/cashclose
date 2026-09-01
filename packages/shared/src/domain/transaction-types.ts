/**
 * مرجع قطعی انواع تراکنش‌های صندوق.
 *
 * منبع: سند «cash close.docx» (شرح کامل هر قلم) + فرمول‌های زندهٔ فایل
 * «صندوق (3).xlsm» (سلول B15 برای مانده صندوق و B18 برای جمع اسناد).
 *
 * این فایل تنها منبع حقیقت برای موتور محاسبه است؛ افزودن یک قلم جدید
 * فقط با اضافه‌کردن یک ردیف به همین جدول انجام می‌شود و موتور محاسبه،
 * اعتبارسنجی و UI به‌صورت خودکار آن را می‌بینند.
 */

/** سمت قلم در معادلهٔ صندوق. */
export const FormulaSide = {
  /** جزء مثبت «مانده صندوق» (سمت راست B15 در اکسل). */
  BALANCE_ADD: 'balance_add',
  /** جزء منفی «مانده صندوق» (داخل پرانتز دوم B15). */
  BALANCE_SUBTRACT: 'balance_subtract',
  /** جزء «جمع اسناد» (B18) — پول/سند واقعی که در صندوق هست. */
  DOCUMENT: 'document',
} as const;

export type FormulaSide = (typeof FormulaSide)[keyof typeof FormulaSide];

/** شناسهٔ یکتای هر نوع تراکنش (مقدار ستون `type` در دیتابیس). */
export const TransactionType = {
  // ─── اجزای مثبت مانده صندوق ───
  SALES_TOTAL: 'sales_total',
  CUSTOMER_REFUND: 'customer_refund',
  DEBT_RECEIPT: 'debt_receipt',
  DEPOSIT_RECEIPT: 'deposit_receipt',
  EXPENSE_RECEIPT: 'expense_receipt',
  CASH_SURPLUS: 'cash_surplus',
  CREDIT_NOTE_ISSUED: 'credit_note_issued',
  CREDIT_DOC_ISSUED: 'credit_doc_issued',

  // ─── اجزای منفی مانده صندوق ───
  BARTER: 'barter',
  CREDIT_NOTE_RECEIVED: 'credit_note_received',
  EXPENSE_PAYMENT: 'expense_payment',
  GOODS_RETURN: 'goods_return',
  CASH_SHORTAGE: 'cash_shortage',
  UNSETTLED_PURCHASE: 'unsettled_purchase',
  PRIOR_DEPOSIT: 'prior_deposit',
  VIP_DISCOUNT: 'vip_discount',

  // ─── اجزای جمع اسناد ───
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
  /** برچسب فارسی — دقیقاً مطابق فایل اکسل واقعی. */
  readonly label: string;
  readonly side: FormulaSide;
  /** آیا این قلم فیلد توضیح دارد؟ (جدول راهنمای سند) */
  readonly hasDescription: boolean;
  /** آیا این قلم آپلود عکس دارد؟ (جدول راهنمای سند) */
  readonly hasImages: boolean;
  /**
   * آیا این قلم چند ردیفی است؟ مثلاً چک‌ها و کارت‌به‌کارت‌ها می‌توانند
   * چندین رکورد داشته باشند، ولی «فروش کل» فقط یک مقدار دارد.
   */
  readonly isMultiRow: boolean;
  /** توضیح کسب‌وکاری برای نمایش در Tooltip راهنما. */
  readonly hint: string;
}

/**
 * جدول کامل ۲۲ قلمی.
 *
 * توجه: «واریز به مشتری/جنس برگشتی» (CUSTOMER_REFUND) و «برگشت کالا»
 * (GOODS_RETURN) دو قلم مجزا هستند — اولی مثبت و دومی منفی — که هم در
 * فایل اکسل واقعی و هم در جدول راهنمای سند به‌صورت جداگانه آمده‌اند.
 */
export const TRANSACTION_TYPES: readonly TransactionTypeDefinition[] = [
  // ─── مثبت ───
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

  // ─── منفی ───
  {
    type: TransactionType.BARTER,
    label: 'تهاتر',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'مشتری جنسی آورده و فروخته و با مابه‌التفاوت آن جنس دیگری خریده است؛ شمارهٔ فاکتور در توضیح.',
  },
  {
    type: TransactionType.CREDIT_NOTE_RECEIVED,
    label: 'دریافت سند بستانکاری',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'مشتری وجه را در شعبهٔ دیگری پرداخت کرده و اکنون نیازی به پرداخت مجدد نیست.',
  },
  {
    type: TransactionType.EXPENSE_PAYMENT,
    label: 'پرداخت هزینه',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: true,
    isMultiRow: true,
    hint: 'پرداخت هزینه بابت انجام سرویسی که وجه آن از مشتری دریافت شده است.',
  },
  {
    type: TransactionType.GOODS_RETURN,
    label: 'برگشت کالا',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: false,
    hasImages: true,
    isMultiRow: false,
    hint: 'مبلغ برگشت کالا ثبت‌شده در سیستم حسابداری.',
  },
  {
    type: TransactionType.CASH_SHORTAGE,
    label: 'کسری صندوق',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'قرینهٔ مازاد صندوقِ روز قبل، یا هر دلیل موجه دیگر با تأیید کارفرما.',
  },
  {
    type: TransactionType.UNSETTLED_PURCHASE,
    label: 'خرید بدون تسویه',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'مشتری خرید کرده ولی قرار است وجه آن را بعداً واریز کند.',
  },
  {
    type: TransactionType.PRIOR_DEPOSIT,
    label: 'بیعانه از قبل',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'بخشی از وجه که پیش‌تر به‌عنوان بیعانه دریافت شده و امروز از مبلغ کل کسر می‌شود.',
  },
  {
    type: TransactionType.VIP_DISCOUNT,
    label: 'تخفیف VIP',
    side: FormulaSide.BALANCE_SUBTRACT,
    hasDescription: true,
    hasImages: false,
    isMultiRow: true,
    hint: 'تخفیف خارج از سیستم حسابداری که امکان ثبت آن در نرم‌افزار حسابداری وجود نداشته است.',
  },

  // ─── جمع اسناد ───
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

/** نگاشت سریع `type` به تعریف آن. */
export const TRANSACTION_TYPE_MAP: ReadonlyMap<
  TransactionType,
  TransactionTypeDefinition
> = new Map(TRANSACTION_TYPES.map((def) => [def.type, def]));

/** همهٔ شناسه‌های مجاز — برای اعتبارسنجی و enum دیتابیس. */
export const TRANSACTION_TYPE_VALUES = TRANSACTION_TYPES.map((d) => d.type);

export function getTransactionType(
  type: TransactionType,
): TransactionTypeDefinition {
  const def = TRANSACTION_TYPE_MAP.get(type);
  if (!def) throw new Error(`نوع تراکنش نامعتبر است: ${type}`);
  return def;
}

/** اقلام یک سمت مشخص از فرمول. */
export function getTypesBySide(
  side: FormulaSide,
): readonly TransactionTypeDefinition[] {
  return TRANSACTION_TYPES.filter((d) => d.side === side);
}
