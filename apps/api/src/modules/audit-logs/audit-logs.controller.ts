import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TenantId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ListLogsDto } from './dto/list-logs.dto';
import { AuditLogsService } from './audit-logs.service';

/**
 * صفحهٔ لاگ عملیات — فقط نمایش.
 *
 * هیچ مسیر نوشتن یا حذفی وجود ندارد: لاگ ممیزی باید تغییرناپذیر بماند
 * تا ارزش کنترلی داشته باشد.
 */
@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
@Roles(UserRole.store_manager, UserRole.owner)
export class AuditLogsController {
  constructor(private readonly logs: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست لاگ عملیات' })
  findAll(@TenantId() tenantId: string, @Query() query: ListLogsDto) {
    return this.logs.findAll(tenantId, query, {
      action: query.action,
      userId: query.userId,
      entityType: query.entityType,
    });
  }
}
