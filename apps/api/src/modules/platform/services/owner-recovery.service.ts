import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { PasswordService } from '../../auth/services/password.service';

/**
 * بازنشانی رمز **مالک** یک مجموعه، توسط مدیر سامانه.
 *
 * چرا لازم است: صندوقدار که رمزش را فراموش کند، مدیر فروشگاه رمز تازه
 * می‌دهد. ولی اگر خودِ مالک فراموش کند، بالادستی‌ای در آن مجموعه نیست —
 * تنها راه، مدیر سامانه است.
 *
 * عمداً **فقط نقش مالک** را می‌پذیرد: اگر هر کاربری را می‌شد بازنشانی
 * کرد، مدیر سامانه عملاً به حساب صندوقدارها هم دسترسی داشت و آن مرزی
 * که بین ما و دادهٔ مشتری گذاشته‌ایم بی‌معنا می‌شد.
 */
@Injectable()
export class OwnerRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  /** مالکان یک مجموعه — برای انتخاب در فرم. */
  async listOwners(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: UserRole.owner,
        status: UserStatus.active,
      },
      select: { id: true, username: true, fullName: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resetOwnerPassword(
    tenantId: string,
    userId: string,
    newPassword: string,
  ) {
    const owner = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, role: UserRole.owner },
      select: { id: true, username: true, fullName: true },
    });

    if (!owner) {
      throw new NotFoundException('مالک موردنظر در این مجموعه یافت نشد.');
    }

    await this.prisma.user.update({
      where: { id: owner.id },
      data: { passwordHash: await this.passwords.hash(newPassword) },
    });

    return {
      message: `رمز «${owner.fullName}» تغییر کرد.`,
      username: owner.username,
    };
  }
}
