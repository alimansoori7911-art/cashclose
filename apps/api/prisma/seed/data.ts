import { UserRole } from '@prisma/client';

/**
 * دادهٔ ثابت نمونه برای محیط توسعه.
 *
 * شناسه‌ها ثابت‌اند تا اجرای دوبارهٔ seed داده را تکراری نکند
 * (idempotent بودن با upsert)، ولی **UUID نسخهٔ ۴ معتبر** هستند نه
 * الگوهای ساختگی مثل `0000...0001` — چون آن‌ها رقم نسخهٔ نامعتبر دارند
 * و از اعتبارسنجی ورودی API رد می‌شوند.
 */

/** رمز مشترک کاربران نمونه — فقط محیط توسعه. */
export const DEMO_PASSWORD = 'Cashclose@1404';

export const TENANT = {
  id: '7eacf9a9-f84d-408d-9584-f498434e468b',
  name: 'فروشگاه رهاوی',
} as const;

export const STORE = {
  id: '548d73c0-f4dd-4fc6-a105-e1147ccf28ae',
  name: 'فروشگاه رهاوی',
  address: 'تهران',
  phone: '02112345678',
} as const;

export const BRANCHES = [
  { id: '466c63ca-d5c3-4fca-9419-fc44499fdc9f', name: 'شعبهٔ ونک' },
  { id: '0e0cf7cc-ef9f-44c4-89c7-edf1d9902034', name: 'شعبهٔ تهران‌پارس' },
] as const;

export interface SeedUser {
  readonly username: string;
  readonly fullName: string;
  readonly role: UserRole;
  /** `true` یعنی به شعبهٔ اصلی وصل شود؛ نقش‌های ستادی شعبه ندارند. */
  readonly attachToBranch: boolean;
}

export const USERS: readonly SeedUser[] = [
  {
    username: 'cashier1',
    fullName: 'علی احمدی',
    role: UserRole.cashier,
    attachToBranch: true,
  },
  {
    username: 'cashier2',
    fullName: 'مریم رضایی',
    role: UserRole.cashier,
    attachToBranch: true,
  },
  {
    username: 'accountant',
    fullName: 'حسین کریمی',
    role: UserRole.accountant,
    attachToBranch: false,
  },
  {
    username: 'manager',
    fullName: 'زهرا موسوی',
    role: UserRole.store_manager,
    attachToBranch: false,
  },
  {
    username: 'owner',
    fullName: 'رضا رهاوی',
    role: UserRole.owner,
    attachToBranch: false,
  },
];

/** کارتخوان‌ها — نام بانک‌ها برگرفته از فایل اکسل واقعی. */
export const TERMINALS = [
  { id: '821ed41e-7c36-4dd5-9bb8-217ea9056d32', bank: 'سامان' },
  { id: 'f9b22872-3917-4bc2-840c-9b9d9a2a624c', bank: 'ملت' },
  { id: 'fe15a326-e05a-4b80-9eb9-52aa62109fc9', bank: 'اقتصاد نوین' },
  { id: 'a1931dbf-166c-46f3-b836-efe6ff23d442', bank: 'صادرات' },
  { id: '799e1fc9-3744-4848-87c4-4605bf7a921b', bank: 'آینده' },
] as const;
