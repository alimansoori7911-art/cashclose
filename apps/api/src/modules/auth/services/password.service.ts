import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * هش و راستی‌آزمایی رمز عبور و توکن‌های بازیابی.
 *
 * Argon2id انتخاب شد (سند bcrypt گفته بود): برندهٔ Password Hashing
 * Competition و مقاوم‌تر در برابر حملات موازی GPU.
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19_456, // ۱۹ مگابایت — پیشنهاد OWASP
    timeCost: 2,
    parallelism: 1,
  };

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      // هش خراب یا با قالب ناشناخته نباید درخواست را با خطای ۵۰۰
      // بترکاند؛ از دید کاربر یعنی رمز اشتباه است.
      return false;
    }
  }

  /**
   * تولید توکن بازیابی رمز.
   *
   * مقدار خام فقط یک‌بار به کاربر می‌رسد و در دیتابیس تنها هشِ آن ذخیره
   * می‌شود — تا دسترسی خواندنی به دیتابیس امکان جعل لینک بازیابی ندهد.
   */
  createResetToken(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: this.hashToken(token) };
  }

  /** SHA-256 کافی است: توکن خودش تصادفیِ ۲۵۶ بیتی است و حملهٔ فرهنگ‌لغت معنا ندارد. */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** مقایسهٔ زمان‌ثابت برای جلوگیری از حملات زمان‌سنجی. */
  safeCompare(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) return false;
    return timingSafeEqual(bufferA, bufferB);
  }
}
