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
import { PaginationDto } from '../../common/pagination/pagination.dto';
import type { RequestUser } from '../../common/tenant/request-user';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { StoresQuery } from './stores.query';
import { StoresService } from './stores.service';

/**
 * مسیرهای فروشگاه.
 *
 * خواندن برای نقش‌های مدیریتی باز است، ولی تغییر فقط برای مدیر فروشگاه
 * و مالک — طبق بخش ۳ سند، مدیر مالی نقش «فقط خواندنی» دارد.
 */
@ApiTags('stores')
@ApiBearerAuth()
@Controller('stores')
export class StoresController {
  constructor(
    private readonly stores: StoresService,
    private readonly query: StoresQuery,
  ) {}

  @Get()
  @Roles(
    UserRole.store_manager,
    UserRole.owner,
    UserRole.financial_manager,
    UserRole.accountant,
  )
  @ApiOperation({ summary: 'فهرست فروشگاه‌ها' })
  findAll(@TenantId() tenantId: string, @Query() pagination: PaginationDto) {
    return this.query.findAll(tenantId, pagination);
  }

  @Get(':id')
  @Roles(
    UserRole.store_manager,
    UserRole.owner,
    UserRole.financial_manager,
    UserRole.accountant,
  )
  @ApiOperation({ summary: 'جزئیات یک فروشگاه به‌همراه شعبه‌ها' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.query.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'ایجاد فروشگاه' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateStoreDto) {
    return this.stores.create(user.tenantId, user.id, dto);
  }

  @Patch(':id')
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'ویرایش فروشگاه' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.stores.update(user.tenantId, user.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'غیرفعال‌سازی فروشگاه (بدون حذف داده)' })
  deactivate(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.stores.deactivate(user.tenantId, user.id, id);
  }
}
