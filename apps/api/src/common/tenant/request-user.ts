import type { UserRole } from '@prisma/client';

/**
 * هویت کاربر پس از اعتبارسنجی توکن.
 *
 * این شیء تنها منبع تشخیص «کی هستی و به کدام مستأجر تعلق داری» در کل
 * بک‌اند است. `tenantId` هرگز از بدنهٔ درخواست یا کوئری خوانده نمی‌شود —
 * فقط از همین‌جا — تا کاربر نتواند با دست‌کاری ورودی، دادهٔ مستأجر دیگری
 * را ببیند.
 */
export interface RequestUser {
  readonly id: string;
  readonly tenantId: string;
  readonly username: string;
  readonly role: UserRole;
  /** نقش‌های ستادی (حسابدار، مدیر) شعبه ندارند. */
  readonly branchId: string | null;
}

/** محتوای رمزنگاری‌شده در JWT. */
export interface JwtPayload {
  /** شناسهٔ کاربر (استاندارد JWT: subject). */
  readonly sub: string;
  readonly tenantId: string;
  readonly username: string;
  readonly role: UserRole;
  readonly branchId: string | null;
}

/** درخواستی که از Guard احراز هویت عبور کرده است. */
export interface AuthenticatedRequest {
  user: RequestUser;
}
