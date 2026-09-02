import { describe, expect, it } from 'vitest';

import { PasswordService } from './password.service';

const passwords = new PasswordService();

describe('PasswordService', () => {
  it('رمز درست را تأیید می‌کند', async () => {
    const hash = await passwords.hash('Cashclose@1404');
    await expect(passwords.verify(hash, 'Cashclose@1404')).resolves.toBe(true);
  });

  it('رمز اشتباه را رد می‌کند', async () => {
    const hash = await passwords.hash('Cashclose@1404');
    await expect(passwords.verify(hash, 'WrongPassword')).resolves.toBe(false);
  });

  it('هش دو رمز یکسان متفاوت است (salt تصادفی)', async () => {
    const [a, b] = await Promise.all([
      passwords.hash('same-password'),
      passwords.hash('same-password'),
    ]);
    expect(a).not.toBe(b);
  });

  it('از الگوریتم argon2id استفاده می‌کند', async () => {
    const hash = await passwords.hash('x');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('هش خراب باعث خطا نمی‌شود و فقط false برمی‌گرداند', async () => {
    // اگر این throw می‌کرد، یک رکورد خراب در دیتابیس کل مسیر ورود را
    // با خطای ۵۰۰ می‌شکست.
    await expect(passwords.verify('not-a-valid-hash', 'x')).resolves.toBe(
      false,
    );
  });

  it('توکن بازیابی را به‌صورت هش‌شده تحویل می‌دهد', () => {
    const { token, tokenHash } = passwords.createResetToken();

    expect(token.length).toBeGreaterThan(20);
    // مقدار خام هرگز نباید همان چیزی باشد که ذخیره می‌شود.
    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toBe(passwords.hashToken(token));
  });

  it('هر توکن بازیابی یکتاست', () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => passwords.createResetToken().token),
    );
    expect(tokens.size).toBe(50);
  });

  it('مقایسهٔ زمان‌ثابت درست کار می‌کند', () => {
    expect(passwords.safeCompare('abc', 'abc')).toBe(true);
    expect(passwords.safeCompare('abc', 'abd')).toBe(false);
    // طول متفاوت نباید استثنا بدهد.
    expect(passwords.safeCompare('abc', 'abcd')).toBe(false);
  });
});
