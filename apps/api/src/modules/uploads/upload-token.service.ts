import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * امضای کوتاه‌مدت برای دسترسی به تصویر.
 *
 * چرا لازم است: تگ `<img src="...">` هدر `Authorization` نمی‌فرستد، پس
 * مسیر تصویر با توکن معمولی کار نمی‌کند. راه‌های جایگزین بدتر بودند:
 *  • گذاشتن JWT در query string → در لاگ سرور و تاریخچهٔ مرورگر می‌ماند.
 *  • باز گذاشتن مسیر تصویر → هر کسی با حدس شناسه به مدارک مالی می‌رسد.
 *
 * این امضا فقط برای همان یک تصویر و همان کاربر معتبر است و پس از مدت
 * کوتاهی منقضی می‌شود.
 */
@Injectable()
export class UploadTokenService {
  private readonly secret: string;
  private static readonly TTL_SECONDS = 15 * 60;

  constructor(config: ConfigService) {
    // از همان راز JWT مشتق می‌شود تا راز جداگانه‌ای برای مدیریت نباشد،
    // ولی با پیشوند متفاوت تا با توکن‌های نشست قابل تعویض نباشد.
    this.secret = `image-access:${config.getOrThrow<string>('JWT_SECRET')}`;
  }

  /**
   * ساخت امضا برای یک تصویر و کاربر مشخص.
   *
   * قالب: `expiresAt.userId.signature` — شناسهٔ کاربر داخل توکن است تا
   * هنگام بررسی، سرور بداند امضا برای چه کسی صادر شده بدون اینکه لازم
   * باشد آن را جداگانه در URL بگذاریم.
   */
  sign(uploadId: string, userId: string): { token: string; expiresAt: number } {
    const expiresAt =
      Math.floor(Date.now() / 1000) + UploadTokenService.TTL_SECONDS;

    const signature = this.digest(uploadId, userId, expiresAt);
    return {
      token: `${expiresAt}.${Buffer.from(userId).toString('base64url')}.${signature}`,
      expiresAt,
    };
  }

  /** بررسی امضا؛ در صورت اعتبار، شناسهٔ کاربر برمی‌گردد. */
  verify(token: string, uploadId: string): string | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [rawExpires, rawUser, provided] = parts as [string, string, string];
    const expiresAt = Number(rawExpires);

    if (!Number.isFinite(expiresAt)) return null;
    if (expiresAt < Math.floor(Date.now() / 1000)) return null;

    let userId: string;
    try {
      userId = Buffer.from(rawUser, 'base64url').toString('utf8');
    } catch {
      return null;
    }

    const expected = this.digest(uploadId, userId, expiresAt);

    // مقایسهٔ زمان‌ثابت برای جلوگیری از حملات زمان‌سنجی.
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    return userId;
  }

  private digest(uploadId: string, userId: string, expiresAt: number): string {
    return createHmac('sha256', this.secret)
      .update(`${uploadId}:${userId}:${expiresAt}`)
      .digest('base64url');
  }
}
