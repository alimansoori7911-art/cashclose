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
import { ListBranchesDto } from './dto/list-branches.dto';
import type { RequestUser } from '../../common/tenant/request-user';
import { BranchesQuery } from './branches.query';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branches: BranchesService,
    private readonly query: BranchesQuery,
  ) {}

  /**
   * فهرست شعبه‌ها برای همهٔ نقش‌ها باز است — صندوقدار هم برای انتخاب
   * شعبه به آن نیاز دارد. جداسازی مستأجر در سرویس اعمال می‌شود.
   */
  @Get()
  @ApiOperation({ summary: 'فهرست شعبه‌ها' })
  findAll(@TenantId() tenantId: string, @Query() query: ListBranchesDto) {
    return this.query.findAll(tenantId, query, query.storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات شعبه' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.query.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'ایجاد شعبه' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBranchDto) {
    return this.branches.create(user.tenantId, user.id, dto);
  }

  @Patch(':id')
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'ویرایش شعبه' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branches.update(user.tenantId, user.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'غیرفعال‌سازی شعبه' })
  deactivate(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.branches.deactivate(user.tenantId, user.id, id);
  }
}
