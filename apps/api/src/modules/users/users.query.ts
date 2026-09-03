import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  paginate,
  type PaginatedResult,
  type PaginationDto,
} from '../../common/pagination/pagination.dto';

/** فیلدهای عمومی کاربر — `passwordHash` هرگز اینجا نیست. */
export const USER_FIELDS = {
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

export interface UserFilters {
  role?: UserRole;
  branchId?: string;
  status?: UserStatus;
}

/**
 * خواندن کاربران — جدا از نوشتن نگه داشته شده تا هر فایل یک مسئولیت
 * داشته باشد.
 *
 * `tenantId` در هر متد اجباری است و از توکن می‌آید، نه از ورودی درخواست.
 */
@Injectable()
export class UsersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    filters: UserFilters = {},
  ): Promise<PaginatedResult<unknown>> {
    const where = {
      tenantId,
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_FIELDS,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      // فیلتر مستأجر همراه شناسه می‌آید: حدس‌زدن UUID کاربرِ مستأجر دیگر
      // هم به داده منتهی نمی‌شود.
      where: { id, tenantId },
      select: USER_FIELDS,
    });

    if (!user) throw new NotFoundException('کاربر یافت نشد.');
    return user;
  }

  /** بررسی تعلق شعبه به همین مستأجر. */
  async assertBranchInTenant(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
      select: { id: true },
    });

    if (!branch) throw new NotFoundException('شعبه یافت نشد.');
  }
}
