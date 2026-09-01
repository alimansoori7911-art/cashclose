/**
 * قالب‌بندی مبالغ ریالی با جداکنندهٔ هزارگان.
 *
 * قاعدهٔ سیستم: مبالغ در دیتابیس و API همیشه عدد صحیح ریال هستند و
 * جداکننده فقط در لایهٔ نمایش اضافه می‌شود (طبق بخش ۹.۷ سند: «عدد باید
 * بدون کاما ارسال شود»).
 */

/** حداکثر ۹ رقم برای مبلغ ورودی — بخش ۹.۷ سند PRD. */
export const MAX_AMOUNT_DIGITS = 9;
export const MAX_AMOUNT = 999_999_999;

const formatter = new Intl.NumberFormat('fa-IR', { useGrouping: true });

/** «۱٬۲۳۴٬۵۶۷» با ارقام فارسی. */
export function formatMoney(amount: number | bigint): string {
  return formatter.format(amount);
}

/** «1,234,567» با ارقام لاتین — مناسب ورودی‌های عددی و خروجی اکسل. */
export function formatMoneyLatin(amount: number | bigint): string {
  return amount.toLocaleString('en-US');
}

/** افزودن واحد: «۱٬۲۳۴٬۵۶۷ ریال». */
export function formatRial(amount: number | bigint): string {
  return `${formatMoney(amount)} ریال`;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** تبدیل ارقام فارسی/عربی به لاتین — کاربر ممکن است با هر کیبوردی تایپ کند. */
export function normalizeDigits(input: string): string {
  let out = '';
  for (const char of input) {
    const fa = PERSIAN_DIGITS.indexOf(char);
    if (fa !== -1) {
      out += String(fa);
      continue;
    }
    const ar = ARABIC_DIGITS.indexOf(char);
    if (ar !== -1) {
      out += String(ar);
      continue;
    }
    out += char;
  }
  return out;
}

/**
 * تبدیل ورودی کاربر به عدد صحیح.
 * جداکننده‌ها و ارقام فارسی حذف/تبدیل می‌شوند؛ ورودی نامعتبر `null`.
 */
export function parseMoney(input: string): number | null {
  const cleaned = normalizeDigits(input).replace(/[,٬\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d+$/.test(cleaned)) return null;

  const value = Number(cleaned);
  if (!Number.isSafeInteger(value) || value > MAX_AMOUNT) return null;
  return value;
}
