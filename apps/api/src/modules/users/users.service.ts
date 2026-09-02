import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * خواندن کاربران.
 *
 * قاعدهٔ حیاتی: `tenantId` در **هر** کوئری این سرویس اجباری است و از
 * توکن می‌آید، نه از ورودی درخواست. هیچ متدی بدون آن نوشته نمی‌شود —
 * همین یک قاعده، نشت داده بین مستأجرها را غیرممکن می‌کند.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly PUBLIC_FIELDS = {
    id: true,
    fullName: true,
    username: true,
    role: true,
    status: true,
    branchId: true,
    lastLoginAt: true,
    createdAt: true,
    branch: { select: { id: true, name: true } },
  } as const;

  async findAll(
    tenantId: string,
    filters: { role?: UserRole; branchId?: string } = {},
  ) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
      },
      select: UsersService.PUBLIC_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      // فیلتر مستأجر همراه شناسه می‌آید: حدس‌زدن UUID کاربرِ مستأجر دیگر
      // هم به داده منتهی نمی‌شود.
      where: { id, tenantId },
      select: UsersService.PUBLIC_FIELDS,
    });

    if (!user) throw new NotFoundException('کاربر یافت نشد.');
    return user;
  }
}
