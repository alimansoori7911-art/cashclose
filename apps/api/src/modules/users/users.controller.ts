import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  TenantId,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestUser } from '../../common/tenant/request-user';
import {
  CreateUserDto,
  ResetUserPasswordDto,
  UpdateUserDto,
} from './dto/user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UserPasswordService } from './user-password.service';
import { UsersQuery } from './users.query';
import { UsersService } from './users.service';

/** مدیریت کاربران — فقط مدیر فروشگاه و مالک. */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@Roles(UserRole.store_manager, UserRole.owner)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly query: UsersQuery,
    private readonly userPasswords: UserPasswordService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'فهرست کاربران مجموعه' })
  findAll(@TenantId() tenantId: string, @Query() query: ListUsersDto) {
    return this.query.findAll(tenantId, query, {
      role: query.role,
      branchId: query.branchId,
      status: query.status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'اطلاعات یک کاربر' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.query.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد کاربر' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateUserDto) {
    return this.users.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش کاربر (نام، نقش، وضعیت، شعبه)' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(user, id, dto);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'بازنشانی رمز عبور کاربر توسط مدیر' })
  resetPassword(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.userPasswords.reset(user, id, dto.newPassword);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'غیرفعال‌سازی کاربر (بدون حذف داده)' })
  deactivate(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.users.deactivate(user, id);
  }
}
