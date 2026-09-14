import { randomInt } from 'node:crypto';

/**
 * قواعد ساخت مجموعهٔ کسب‌وکار.
 *
 * جدا از دسترسی به دیتابیس نگه داشته شده تا مستقل تست شوند.
 */

/**
 * حروف مجاز کد کسب‌وکار.
 *
 * `I`، `O`، `0` و `1` عمداً نیستند: کد پای تلفن خوانده می‌شود و این
 * چهار نویسه با هم اشتباه گرفته می‌شوند.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

/** کد تصادفی کسب‌وکار — با `randomInt` رمزنگارانه، نه `Math.random`. */
export function generateBusinessCode(): string {
  let code = '';
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * تبدیل نام کسب‌وکار به زیردامنه.
 *
 * نام فارسی زیردامنهٔ معتبر نمی‌سازد، پس اگر چیزی باقی نماند مدیر باید
 * دستی بنویسد — بهتر از ساختن زیردامنهٔ بی‌معنا.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

/** زیردامنه‌هایی که هرگز نباید به مشتری داده شوند. */
export const RESERVED_SLUGS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'static',
  'assets',
  'cdn',
  'status',
  'docs',
  'help',
  'support',
  'billing',
  'panel',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/** قالب مجاز زیردامنه — همان محدودیت DNS. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
}
