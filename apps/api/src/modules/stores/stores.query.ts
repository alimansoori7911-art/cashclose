import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  paginate,
  type PaginatedResult,
  type PaginationDto,
} from '../../common/pagination/pagination.dto';

export const STORE_FIELDS = {
  id: true,
  name: true,
  address: true,
  phone: true,
  isActive: true,
  createdAt: true,
  _count: { select: { branches: true } },
} as const;

/** خواندن فروشگاه‌ها — جدا از نوشتن. */
@Injectable()
export class StoresQuery {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<unknown>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where: { tenantId },
        select: STORE_FIELDS,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.store.count({ where: { tenantId } }),
    ]);

    return paginate(items, total, pagination);
  }

  async findOne(tenantId: string, id: string) {
    const store = await this.prisma.store.findFirst({
      where: { id, tenantId },
      select: {
        ...STORE_FIELDS,
        branches: {
          select: { id: true, name: true, isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!store) throw new NotFoundException('فروشگاه یافت نشد.');
    return store;
  }
}
