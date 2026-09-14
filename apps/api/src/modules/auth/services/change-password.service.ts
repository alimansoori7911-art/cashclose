import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestUser } from '../../../common/tenant/request-user';
import { AuditService } from '../../audit/audit.service';
import { PasswordService } from './password.service';

/**
 * تغییر رمز توسط **خود کاربر**.
 *
 * جدا از `UserPasswordService` است که مدیر با آن رمز دیگران را بازنشانی
 * می‌کند. تفاوت اصلی: اینجا **رمز فعلی** پرسیده می‌شود.
 *
 * چرا رمز فعلی لازم است: اگر کسی پشت رایانهٔ باز صندوقدار بنشیند،
 * بدون این قید می‌تواند رمز را عوض کند و صاحب حساب را بیرون بیندازد.
 */
@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
  ) {}

  async change(actor: RequestUser, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.id },
      select: { id: true, username: true, passwordHash: true },
    });

    // کاربری که توکن معتبر دارد ولی رکوردش نیست، یعنی حساب حذف شده.
    if (!user) {
      throw new BadRequestException('حساب کاربری یافت نشد.');
    }

    const valid = await this.passwords.verify(
      user.passwordHash,
      currentPassword,
    );

    if (!valid) {
      throw new BadRequestException('رمز فعلی نادرست است.');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'رمز تازه باید با رمز فعلی متفاوت باشد.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await this.passwords.hash(newPassword) },
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'password_changed_by_self',
      entityType: 'user',
      entityId: user.id,
      // نام کاربری ثبت می‌شود ولی هیچ‌کدام از دو رمز.
      meta: { username: user.username },
    });

    return { message: 'رمز عبور شما تغییر کرد.' };
  }
}
