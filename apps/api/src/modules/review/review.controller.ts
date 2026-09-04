import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
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
import { ApproveDto, RejectDto } from './dto/review.dto';
import { ReviewService } from './services/review.service';
import { VersionsService } from './services/versions.service';

/**
 * بازبینی صندوق توسط حسابدار.
 *
 * تأیید و رد فقط برای حسابدار؛ مدیر فروشگاه طبق بخش ۳ سند «فقط Read»
 * است و نمی‌تواند تأیید یا رد کند.
 */
@ApiTags('review')
@ApiBearerAuth()
@Controller('cash-registers/:id')
export class ReviewController {
  constructor(
    private readonly review: ReviewService,
    private readonly versions: VersionsService,
  ) {}

  @Post('approve')
  @Roles(UserRole.accountant)
  @ApiOperation({ summary: 'تأیید صندوق' })
  approve(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveDto,
  ) {
    return this.review.approve(user, id, dto.comment);
  }

  @Post('reject')
  @Roles(UserRole.accountant)
  @ApiOperation({ summary: 'رد صندوق (علت الزامی)' })
  reject(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDto,
  ) {
    return this.review.reject(user, id, dto.comment);
  }

  /** فهرست نسخه‌ها — برای همهٔ نقش‌هایی که به صندوق دسترسی دارند. */
  @Get('versions')
  @ApiOperation({ summary: 'فهرست نسخه‌های ارسال‌شدهٔ صندوق' })
  listVersions(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.versions.list(tenantId, id);
  }

  @Get('versions/compare')
  @ApiOperation({ summary: 'مقایسهٔ دو نسخه (پیش‌فرض: دو نسخهٔ آخر)' })
  compareVersions(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from', new ParseIntPipe({ optional: true })) from?: number,
    @Query('to', new ParseIntPipe({ optional: true })) to?: number,
  ) {
    return this.versions.compare(tenantId, id, from, to);
  }
}
