import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import type { RequestUser } from '../../common/tenant/request-user';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/services/password.service';
import { UsersQuery } from './users.query';
import { assertCanModifyTarget } from './users.rules';

/**
 * بازنشانی رمز کاربر توسط مدیر.
 *
 * جدا از `UsersService` نگه داشته شده چون مسیر و رویداد ممیزیِ متمایزی
 * دارد: در لاگ باید بتوان «تغییر رمز توسط مدیر» را از «ویرایش پروفایل»
 * تشخیص داد.
 */
@Injectable()
export class UserPasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: UsersQuery,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
  ) {}

  async reset(actor: RequestUser, id: string, newPassword: string) {
    const target = await this.query.findOne(actor.tenantId, id);
    assertCanModifyTarget(actor, target.role);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await this.passwords.hash(newPassword) },
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'user_password_reset_by_admin',
      entityType: 'user',
      entityId: id,
      // نام کاربری ثبت می‌شود ولی رمز هرگز — `sanitizeMeta` هم لایهٔ
      // دوم دفاع است.
      meta: { username: target.username },
    });

    return { message: 'رمز عبور کاربر تغییر کرد.' };
  }
}
