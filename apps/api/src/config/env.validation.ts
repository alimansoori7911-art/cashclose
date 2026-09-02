import { z } from 'zod';

/**
 * اعتبارسنجی متغیرهای محیطی هنگام بالا آمدن سرویس.
 *
 * هدف: خطای پیکربندی (رمز جانیفتاده، آدرس دیتابیس اشتباه) باید همان
 * ثانیهٔ اول با پیام روشن ظاهر شود، نه وسط یک درخواست کاربر.
 */

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL تنظیم نشده است.')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL باید یک آدرس معتبر PostgreSQL باشد.',
    ),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET باید حداقل ۳۲ کاراکتر باشد.')
    .refine(
      (value) => !value.includes('CHANGE_ME'),
      'JWT_SECRET هنوز مقدار پیش‌فرض نمونه است؛ یک مقدار تصادفی جایگزین کنید.',
    ),
  // قالب مدت‌زمان کتابخانهٔ ms مثل «12h»، «30m»، «7d» — اعتبارسنجی
  // اینجا انجام می‌شود تا مقدار بی‌معنا به‌جای خطای زمان اجرا، همان
  // لحظهٔ استارت گرفته شود.
  JWT_EXPIRES_IN: z
    .string()
    .regex(
      /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)$/i,
      'JWT_EXPIRES_IN باید قالبی مانند «12h» یا «30m» داشته باشد.',
    )
    .default('12h'),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().positive().default(3),
  UPLOAD_MAX_FILES_PER_SECTION: z.coerce.number().int().positive().default(5),

  RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `پیکربندی محیط معتبر نیست:\n${issues}\n\n` +
        'فایل .env را با .env.example مقایسه کنید.',
    );
  }

  return parsed.data;
}
