import { describe, expect, it } from 'vitest';

import { validateEnv } from './env.validation';

/** حداقل مقادیر لازم برای عبور از اعتبارسنجی. */
function baseEnv(overrides: Record<string, unknown> = {}) {
  return {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'a'.repeat(32),
    ...overrides,
  };
}

describe('اعتبارسنجی محیط', () => {
  it('مقادیر معتبر را می‌پذیرد و پیش‌فرض‌ها را پر می‌کند', () => {
    const env = validateEnv(baseEnv());

    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('12h');
    expect(env.NODE_ENV).toBe('development');
  });

  it('JWT_SECRET کوتاه را رد می‌کند', () => {
    expect(() => validateEnv(baseEnv({ JWT_SECRET: 'short' }))).toThrow(
      /۳۲ کاراکتر/,
    );
  });

  it('JWT_SECRET نمونه را رد می‌کند', () => {
    // رایج‌ترین اشتباه استقرار: کپی‌کردن .env.example بدون تغییر مقدار.
    expect(() =>
      validateEnv(baseEnv({ JWT_SECRET: `CHANGE_ME_${'x'.repeat(30)}` })),
    ).toThrow(/پیش‌فرض نمونه/);
  });

  it('آدرس دیتابیس غیر PostgreSQL را رد می‌کند', () => {
    expect(() =>
      validateEnv(baseEnv({ DATABASE_URL: 'mysql://localhost/db' })),
    ).toThrow(/PostgreSQL/);
  });

  it('قالب نامعتبر JWT_EXPIRES_IN را رد می‌کند', () => {
    expect(() =>
      validateEnv(baseEnv({ JWT_EXPIRES_IN: 'دوازده ساعت' })),
    ).toThrow(/۱۲h|12h|قالبی/);
  });

  describe('قواعد محیط تولید', () => {
    const production = { NODE_ENV: 'production' };

    it('CORS باز را رد می‌کند', () => {
      expect(() =>
        validateEnv(baseEnv({ ...production, CORS_ORIGINS: '*' })),
      ).toThrow(/«\*»/);
    });

    it('مبدأ HTTP را رد می‌کند', () => {
      expect(() =>
        validateEnv(
          baseEnv({ ...production, CORS_ORIGINS: 'http://app.example.com' }),
        ),
      ).toThrow(/https/);
    });

    it('حتی یک مبدأ HTTP در میان چند مبدأ HTTPS هم رد می‌شود', () => {
      expect(() =>
        validateEnv(
          baseEnv({
            ...production,
            CORS_ORIGINS: 'https://a.example.com,http://b.example.com',
          }),
        ),
      ).toThrow(/https/);
    });

    it('مبدأ HTTPS معتبر را می‌پذیرد', () => {
      const env = validateEnv(
        baseEnv({ ...production, CORS_ORIGINS: 'https://app.example.com' }),
      );

      expect(env.NODE_ENV).toBe('production');
    });

    it('همین مقادیر در توسعه مجازند', () => {
      // localhost و HTTP فقط در تولید ایراد دارند.
      const env = validateEnv(
        baseEnv({ CORS_ORIGINS: 'http://localhost:5173' }),
      );

      expect(env.CORS_ORIGINS).toBe('http://localhost:5173');
    });
  });
});
