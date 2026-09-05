import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

/**
 * اعتبارسنجی فایل تصویر.
 *
 * چرا فقط به `mimetype` اعتماد نمی‌کنیم: آن مقدار را خودِ کلاینت
 * می‌فرستد و به‌راحتی جعل می‌شود. یک فایل اجرایی می‌تواند با نام
 * `photo.jpg` و مایم‌تایپ `image/jpeg` ارسال شود. پس **بایت‌های ابتدای
 * فایل** (magic number) بررسی می‌شود که جعلش نیازمند ساختن فایل واقعاً
 * معتبر است.
 */

/** قالب‌های مجاز طبق بند ۹.۶ سند. */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

interface Signature {
  readonly mime: string;
  readonly bytes: readonly number[];
  readonly offset: number;
}

/** امضای بایتی قالب‌های تصویری مجاز. */
const SIGNATURES: readonly Signature[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  {
    mime: 'image/png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
  },
  // WebP: «RIFF» در بایت ۰ و «WEBP» در بایت ۸.
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

function matches(buffer: Buffer, signature: Signature): boolean {
  if (buffer.length < signature.offset + signature.bytes.length) return false;

  return signature.bytes.every(
    (byte, index) => buffer[signature.offset + index] === byte,
  );
}

/** تشخیص قالب واقعی از روی محتوا؛ `null` یعنی قالب ناشناخته. */
export function detectImageType(buffer: Buffer): string | null {
  for (const signature of SIGNATURES) {
    if (!matches(buffer, signature)) continue;

    if (signature.mime === 'image/webp') {
      // بررسی تکمیلی: RIFF قالب‌های دیگری هم دارد (مثلاً WAV).
      const isWebp =
        buffer.length >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP';
      if (!isWebp) continue;
    }

    return signature.mime;
  }

  return null;
}

export interface ValidationOptions {
  readonly maxSizeBytes: number;
}

/**
 * اعتبارسنجی کامل فایل آپلودی.
 *
 * ترتیب بررسی‌ها عمدی است: حجم اول، چون بررسی محتوای یک فایل ۵۰۰
 * مگابایتی بی‌فایده است وقتی می‌دانیم رد می‌شود.
 */
export function validateImage(
  file: { buffer: Buffer; size: number; mimetype: string; originalname: string },
  options: ValidationOptions,
): { mimeType: string } {
  if (!file.buffer || file.size === 0) {
    throw new BadRequestException('فایل خالی است.');
  }

  if (file.size > options.maxSizeBytes) {
    // ارقام فارسی تا پیام با بقیهٔ رابط کاربری هماهنگ بماند.
    const limitMb = Math.round(options.maxSizeBytes / (1024 * 1024));
    throw new PayloadTooLargeException(
      `حجم فایل بیش از حد مجاز است. حداکثر ${limitMb.toLocaleString('fa-IR')} مگابایت.`,
    );
  }

  const detected = detectImageType(file.buffer);

  if (!detected) {
    throw new UnsupportedMediaTypeException(
      'فایل ارسالی تصویر معتبر نیست. فقط JPG، PNG و WebP پذیرفته می‌شود.',
    );
  }

  // ناسازگاری بین ادعای کلاینت و محتوای واقعی، نشانهٔ تلاش برای دور زدن
  // فیلتر است — محتوای واقعی ملاک است.
  if (!ALLOWED_MIME_TYPES.includes(detected as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new UnsupportedMediaTypeException(
      'قالب این تصویر پشتیبانی نمی‌شود.',
    );
  }

  return { mimeType: detected };
}
