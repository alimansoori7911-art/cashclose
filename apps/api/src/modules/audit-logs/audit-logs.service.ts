import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  paginate,
  type PaginatedResult,
  type PaginationDto,
} from '../../common/pagination/pagination.dto';

interface LogFilters {
  action?: string;
  userId?: string;
  entityType?: string;
}

/** خواندن لاگ ممیزی. نوشتن فقط از طریق `AuditService` انجام می‌شود. */
@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    filters: LogFilters = {},
  ): Promise<PaginatedResult<unknown>> {
    const where = {
      tenantId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          meta: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }
}
