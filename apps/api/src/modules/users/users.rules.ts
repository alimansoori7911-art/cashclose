import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import type { RequestUser } from '../../common/tenant/request-user';

/**
 * قواعد کسب‌وکاری مربوط به کاربران — جدا از دسترسی به دیتابیس تا
 * بتوان مستقل تستشان کرد.
 */

/** نقش‌هایی که به شعبه وابسته‌اند. */
const BRANCH_BOUND_ROLES: readonly UserRole[] = [UserRole.cashier];

/**
 * صندوقدار بدون شعبه بی‌معناست: صندوق روزانه همیشه به یک شعبه تعلق
 * دارد. نقش‌های ستادی برعکس، نباید به شعبه محدود شوند.
 */
export function assertBranchMatchesRole(
  role: UserRole,
  branchId: string | null | undefined,
): void {
  if (BRANCH_BOUND_ROLES.includes(role) && !branchId) {
    throw new BadRequestException('برای صندوقدار انتخاب شعبه الزامی است.');
  }
}

/**
 * فقط مالک می‌تواند نقش «مالک» بدهد یا بگیرد.
 *
 * بدون این قاعده، یک مدیر فروشگاه می‌توانست خودش را مالک کند و به
 * گزارش‌های مالی کلان دسترسی بگیرد — یعنی ارتقای سطح دسترسی.
 */
export function assertCanAssignRole(
  actor: RequestUser,
  targetRole: UserRole,
): void {
  if (targetRole === UserRole.owner && actor.role !== UserRole.owner) {
    throw new ForbiddenException('تنها مالک می‌تواند نقش مالک را تعیین کند.');
  }
}

/**
 * کاربر نمی‌تواند نقش یا وضعیت خودش را عوض کند.
 *
 * جلوی دو خطا را می‌گیرد: ارتقای خودخواسته، و قفل‌شدن تصادفی مدیر بیرون
 * از سامانه با غیرفعال‌کردن حساب خودش.
 */
export function assertNotSelfModification(
  actor: RequestUser,
  targetUserId: string,
  changes: { role?: UserRole; status?: string },
): void {
  const isSelf = actor.id === targetUserId;
  const touchesPrivileges =
    changes.role !== undefined || changes.status !== undefined;

  if (isSelf && touchesPrivileges) {
    throw new BadRequestException(
      'تغییر نقش یا وضعیت حساب خودتان از این مسیر ممکن نیست.',
    );
  }
}

/** مالک را فقط مالک می‌تواند تغییر دهد. */
export function assertCanModifyTarget(
  actor: RequestUser,
  targetRole: UserRole,
): void {
  if (targetRole === UserRole.owner && actor.role !== UserRole.owner) {
    throw new ForbiddenException(
      'تغییر اطلاعات کاربرِ مالک تنها توسط مالک ممکن است.',
    );
  }
}
