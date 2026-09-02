import { UserRole } from '@prisma/client';

/**
 * دادهٔ ثابت نمونه برای محیط توسعه.
 *
 * شناسه‌ها ثابت‌اند تا اجرای دوبارهٔ seed داده را تکراری نکند
 * (idempotent بودن با upsert).
 */

/** رمز مشترک کاربران نمونه — فقط محیط توسعه. */
export const DEMO_PASSWORD = 'Cashclose@1404';

export const TENANT = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'فروشگاه رهاوی',
} as const;

export const STORE = {
  id: '00000000-0000-0000-0000-000000000010',
  name: 'فروشگاه رهاوی',
  address: 'تهران',
  phone: '02112345678',
} as const;

export const BRANCHES = [
  { id: '00000000-0000-0000-0000-000000000020', name: 'شعبهٔ ونک' },
  { id: '00000000-0000-0000-0000-000000000021', name: 'شعبهٔ تهران‌پارس' },
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

/** نام بانک‌ها برگرفته از فایل اکسل واقعی. */
export const TERMINAL_BANKS = [
  'سامان',
  'ملت',
  'اقتصاد نوین',
  'صادرات',
  'آینده',
] as const;
