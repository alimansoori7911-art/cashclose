import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

import type { StorageProvider, StoredFile } from './storage.interface';

/**
 * ذخیره‌سازی روی دیسک سرور.
 *
 * نکتهٔ امنیتی کلیدی: نام فایل کاربر **هرگز** در مسیر استفاده نمی‌شود.
 * نام واقعی فقط در دیتابیس نگه داشته می‌شود و روی دیسک یک UUID می‌نشیند
 * — این هم حملهٔ path traversal (مثل `../../etc/passwd`) را غیرممکن
 * می‌کند و هم مشکل نام‌های تکراری و کاراکترهای غیرمجاز ویندوز را حل
 * می‌کند.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(
      config.get<string>('STORAGE_LOCAL_PATH', './uploads'),
    );
  }

  async save({
    buffer,
    originalName,
    mimeType,
    scope,
  }: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    scope: string;
  }): Promise<StoredFile> {
    // پسوند از نام اصلی گرفته می‌شود ولی پاک‌سازی می‌شود؛ فقط حروف و
    // رقم می‌ماند تا چیزی مثل `.php.jpg` یا `../` رد نشود.
    const extension = extname(originalName)
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '')
      .slice(0, 10);

    const safeScope = this.sanitizeSegment(scope);
    const key = `${safeScope}/${randomUUID()}${extension}`;
    const target = this.toAbsolute(key);

    await mkdir(join(this.root, safeScope), { recursive: true });
    await writeFile(target, buffer);

    return { key, sizeBytes: buffer.byteLength, mimeType };
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.toAbsolute(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.toAbsolute(key));
    } catch (error) {
      // نبود فایل خطا نیست: ممکن است قبلاً پاک شده باشد و شکست‌دادن
      // عملیات به‌خاطر آن، کاربر را بی‌دلیل گیر می‌اندازد.
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        this.logger.warn(`حذف فایل «${key}» ناموفق بود: ${String(error)}`);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(this.toAbsolute(key));
  }

  /**
   * تبدیل کلید به مسیر مطلق، با تضمین اینکه از ریشه بیرون نزند.
   *
   * حتی با وجود UUID، این بررسی به‌عنوان لایهٔ دوم دفاع باقی می‌ماند:
   * اگر روزی کلیدی از منبع دیگری بیاید، همچنان امن است.
   */
  private toAbsolute(key: string): string {
    const target = resolve(this.root, key);

    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw new Error(`مسیر فایل نامعتبر است: ${key}`);
    }

    return target;
  }

  private sanitizeSegment(value: string): string {
    const cleaned = value.replace(/[^a-zA-Z0-9-]/g, '');
    return cleaned || 'shared';
  }
}
