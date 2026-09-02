import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * محدودکردن یک مسیر به نقش‌های مشخص.
 *
 * استفاده: `@Roles('accountant', 'owner')`
 *
 * بدون این دکوراتور، مسیر برای همهٔ کاربرانِ احرازهویت‌شده باز است —
 * پس روی هر مسیری که دسترسی نقش‌محور دارد باید صریحاً گذاشته شود.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * باز کردن یک مسیر برای دسترسی بدون توکن (لاگین، فراموشی رمز، سلامت).
 *
 * پیش‌فرض سامانه «همه‌چیز بسته» است؛ این دکوراتور تنها راه استثنا کردن
 * یک مسیر است تا باز بودن ناخواسته رخ ندهد.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
