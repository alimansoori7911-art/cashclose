import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
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
  CreatePosTerminalDto,
  UpdatePosTerminalDto,
} from './dto/pos-terminal.dto';
import { PosTerminalsQuery } from './pos-terminals.query';
import { PosTerminalsService } from './pos-terminals.service';

@ApiTags('pos-terminals')
@ApiBearerAuth()
@Controller('pos-terminals')
export class PosTerminalsController {
  constructor(
    private readonly terminals: PosTerminalsService,
    private readonly query: PosTerminalsQuery,
  ) {}

  /**
   * خواندن برای همهٔ نقش‌ها باز است؛ صندوقدار در فرم صندوق به آن نیاز
   * دارد و سرویس، دید او را خودکار به شعبهٔ خودش محدود می‌کند.
   */
  @Get()
  @ApiOperation({ summary: 'فهرست کارتخوان‌ها' })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @Query('activeOnly', new ParseBoolPipe({ optional: true }))
    activeOnly?: boolean,
  ) {
    return this.query.findAll(user, branchId, activeOnly ?? false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات کارتخوان' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.query.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'تعریف کارتخوان جدید' })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePosTerminalDto,
  ) {
    return this.terminals.create(user.tenantId, user.id, dto);
  }

  @Patch(':id')
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'ویرایش کارتخوان و تخصیص به صندوقدار' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePosTerminalDto,
  ) {
    return this.terminals.update(user.tenantId, user.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.store_manager, UserRole.owner)
  @ApiOperation({ summary: 'غیرفعال‌سازی کارتخوان' })
  deactivate(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.terminals.deactivate(user.tenantId, user.id, id);
  }
}
