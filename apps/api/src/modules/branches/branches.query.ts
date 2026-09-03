import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  paginate,
  type PaginatedResult,
  type PaginationDto,
} from '../../common/pagination/pagination.dto';

export const BRANCH_FIELDS = {
  id: true,
  name: true,
  address: true,
  isActive: true,
  storeId: true,
  createdAt: true,
  store: { select: { id: true, name: true } },
  _count: { select: { users: true, posTerminals: true } },
} as const;

/** خواندن شعبه‌ها — جدا از نوشتن. */
@Injectable()
export class BranchesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    storeId?: string,
  ): Promise<PaginatedResult<unknown>> {
    const where = { tenantId, ...(storeId ? { storeId } : {}) };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where,
        select: BRANCH_FIELDS,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId },
      select: BRANCH_FIELDS,
    });

    if (!branch) throw new NotFoundException('شعبه یافت نشد.');
    return branch;
  }
}
