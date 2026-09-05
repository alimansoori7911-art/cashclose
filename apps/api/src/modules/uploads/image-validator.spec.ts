import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { detectImageType, validateImage } from './image-validator';

/** ساخت بافر با امضای بایتی مشخص. */
function bufferWith(bytes: number[], padding = 100): Buffer {
  return Buffer.concat([Buffer.from(bytes), Buffer.alloc(padding)]);
}

const JPEG = bufferWith([0xff, 0xd8, 0xff, 0xe0]);
const PNG = bufferWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.concat([
  Buffer.from([0x52, 0x49, 0x46, 0x46]),
  Buffer.alloc(4),
  Buffer.from('WEBP', 'ascii'),
  Buffer.alloc(100),
]);

function asFile(buffer: Buffer, overrides: Partial<{ mimetype: string; originalname: string }> = {}) {
  return {
    buffer,
    size: buffer.byteLength,
    mimetype: 'image/jpeg',
    originalname: 'photo.jpg',
    ...overrides,
  };
}

const OPTIONS = { maxSizeBytes: 3 * 1024 * 1024 };

describe('تشخیص قالب تصویر از محتوا', () => {
  it('JPEG را تشخیص می‌دهد', () => {
    expect(detectImageType(JPEG)).toBe('image/jpeg');
  });

  it('PNG را تشخیص می‌دهد', () => {
    expect(detectImageType(PNG)).toBe('image/png');
  });

  it('WebP را تشخیص می‌دهد', () => {
    expect(detectImageType(WEBP)).toBe('image/webp');
  });

  it('فایل RIFF غیر WebP را رد می‌کند', () => {
    // WAV هم با RIFF شروع می‌شود؛ بررسی تکمیلی باید آن را جدا کند.
    const wav = Buffer.concat([
      Buffer.from([0x52, 0x49, 0x46, 0x46]),
      Buffer.alloc(4),
      Buffer.from('WAVE', 'ascii'),
      Buffer.alloc(100),
    ]);
    expect(detectImageType(wav)).toBeNull();
  });

  it('محتوای ناشناخته را null برمی‌گرداند', () => {
    expect(detectImageType(Buffer.from('این یک متن ساده است'))).toBeNull();
  });
});

describe('اعتبارسنجی فایل آپلودی', () => {
  it('تصویر معتبر پذیرفته می‌شود', () => {
    expect(validateImage(asFile(JPEG), OPTIONS)).toEqual({
      mimeType: 'image/jpeg',
    });
  });

  it('فایل خالی رد می‌شود', () => {
    expect(() =>
      validateImage(
        { buffer: Buffer.alloc(0), size: 0, mimetype: 'image/jpeg', originalname: 'x.jpg' },
        OPTIONS,
      ),
    ).toThrow(BadRequestException);
  });

  it('فایل بزرگ‌تر از سقف رد می‌شود', () => {
    const big = { ...asFile(JPEG), size: 4 * 1024 * 1024 };
    expect(() => validateImage(big, OPTIONS)).toThrow(PayloadTooLargeException);
    expect(() => validateImage(big, OPTIONS)).toThrow(/۳ مگابایت/);
  });

  it('فایل اجرایی با نام و مایم‌تایپ جعلی رد می‌شود', () => {
    // مهم‌ترین تست این فایل: مهاجم مایم‌تایپ و پسوند را جعل می‌کند ولی
    // محتوا همچنان اجرایی است. اگر فقط به mimetype اعتماد می‌کردیم،
    // این فایل پذیرفته می‌شد.
    const executable = Buffer.concat([
      Buffer.from([0x4d, 0x5a]), // امضای فایل اجرایی ویندوز (MZ)
      Buffer.alloc(200),
    ]);

    expect(() =>
      validateImage(
        asFile(executable, { mimetype: 'image/jpeg', originalname: 'photo.jpg' }),
        OPTIONS,
      ),
    ).toThrow(UnsupportedMediaTypeException);
  });

  it('اسکریپت PHP با پسوند jpg رد می‌شود', () => {
    const php = Buffer.from('<?php system($_GET["c"]); ?>');
    expect(() =>
      validateImage(asFile(php, { originalname: 'shell.jpg' }), OPTIONS),
    ).toThrow(UnsupportedMediaTypeException);
  });

  it('SVG رد می‌شود (امکان اجرای اسکریپت دارد)', () => {
    const svg = Buffer.from('<svg onload="alert(1)"></svg>');
    expect(() =>
      validateImage(asFile(svg, { mimetype: 'image/svg+xml' }), OPTIONS),
    ).toThrow(UnsupportedMediaTypeException);
  });

  it('PNG با مایم‌تایپ اشتباه، بر اساس محتوای واقعی پذیرفته می‌شود', () => {
    // ادعای کلاینت اشتباه است ولی محتوا واقعاً PNG است؛ محتوا ملاک است.
    const result = validateImage(
      asFile(PNG, { mimetype: 'application/octet-stream' }),
      OPTIONS,
    );
    expect(result.mimeType).toBe('image/png');
  });
});
