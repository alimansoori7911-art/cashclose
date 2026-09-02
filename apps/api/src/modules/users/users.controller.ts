import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TenantId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';

/**
 * مسیرهای کاربران.
 *
 * در این فاز فقط خواندن پیاده شده؛ ساخت و ویرایش کاربر در فاز ۲
 * (مدیریت فروشگاه) اضافه می‌شود.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@Roles(UserRole.store_manager, UserRole.owner)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست کاربران مجموعه' })
  findAll(
    @TenantId() tenantId: string,
    @Query('role') role?: UserRole,
    @Query('branchId') branchId?: string,
  ) {
    return this.users.findAll(tenantId, { role, branchId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'اطلاعات یک کاربر' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.findOne(tenantId, id);
  }
}
