import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * فهرست و وضعیت مجموعه‌ها — نمای مدیر سامانه.
 *
 * عمداً فقط شمارش برمی‌گرداند، نه محتوای داده: مدیر سامانه باید بداند
 * هر مشتری چند شعبه و چند کاربر دارد، ولی نباید بتواند صندوق یا مبلغی
 * را ببیند. همان مرزی که بین خود مشتری‌ها هست، اینجا هم برقرار است.
 */
@Injectable()
export class TenantAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const tenants = await this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        status: true,
        createdAt: true,
        _count: {
          select: { stores: true, branches: true, users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((tenant) => ({
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
    }));
  }

  /**
   * تعلیق یا فعال‌سازی مجموعه.
   *
   * تعلیق داده را پاک نمی‌کند؛ فقط ورود را می‌بندد — برای وقتی که مشتری
   * اشتراکش را تمدید نکرده است.
   */
  async setStatus(id: string, status: TenantStatus) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tenant) throw new NotFoundException('مجموعه یافت نشد.');

    await this.prisma.tenant.update({ where: { id }, data: { status } });

    return {
      message:
        status === TenantStatus.active
          ? `«${tenant.name}» فعال شد.`
          : `«${tenant.name}» تعلیق شد؛ کاربرانش دیگر نمی‌توانند وارد شوند.`,
    };
  }
}
