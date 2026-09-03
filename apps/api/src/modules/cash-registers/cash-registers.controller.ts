import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CashRegisterStatus, UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import type { RequestUser } from '../../common/tenant/request-user';
import { CreateCashRegisterDto } from './dto/create-register.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { RegisterCloseService } from './services/register-close.service';
import { RegisterCreationService } from './services/register-creation.service';
import { RegisterDraftService } from './services/register-draft.service';
import { RegisterQueryService } from './services/register-query.service';

@ApiTags('cash-registers')
@ApiBearerAuth()
@Controller('cash-registers')
export class CashRegistersController {
  constructor(
    private readonly query: RegisterQueryService,
    private readonly creation: RegisterCreationService,
    private readonly draft: RegisterDraftService,
    private readonly closing: RegisterCloseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'فهرست صندوق‌ها' })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
    @Query('status') status?: CashRegisterStatus,
    @Query('branchId') branchId?: string,
    @Query('cashierId') cashierId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.query.findAll(user, pagination, {
      status,
      branchId,
      cashierId,
      dateFrom,
      dateTo,
    });
  }

  /** صندوق باز فعلی — نقطهٔ ورود داشبورد صندوقدار. */
  @Get('current')
  @Roles(UserRole.cashier)
  @ApiOperation({ summary: 'صندوق باز فعلی صندوقدار' })
  async findCurrent(@CurrentUser() user: RequestUser) {
    const register = await this.query.findOpenForCashier(user);
    return register ?? null;
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات کامل صندوق' })
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.query.findOne(user, id);
  }

  @Post()
  @Roles(UserRole.cashier)
  @ApiOperation({ summary: 'ایجاد صندوق روزانه' })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCashRegisterDto,
  ) {
    return this.creation.create(user, dto);
  }

  @Patch(':id/draft')
  @Roles(UserRole.cashier)
  @ApiOperation({ summary: 'ذخیرهٔ پیش‌نویس' })
  saveDraft(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveDraftDto,
  ) {
    return this.draft.saveDraft(user, id, dto);
  }

  @Patch(':id/close')
  @Roles(UserRole.cashier)
  @ApiOperation({ summary: 'بستن صندوق و ارسال برای حسابدار' })
  close(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.closing.close(user, id);
  }
}
