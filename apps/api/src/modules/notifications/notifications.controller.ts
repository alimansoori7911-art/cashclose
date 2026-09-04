import {
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import type { RequestUser } from '../../common/tenant/request-user';
import { NotificationsService } from './notifications.service';

/**
 * اعلان‌ها.
 *
 * همهٔ مسیرها فقط اعلان‌های کاربر جاری را برمی‌گردانند؛ مسیری برای
 * دیدن اعلان دیگران وجود ندارد.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست اعلان‌های من' })
  findMine(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true }))
    unreadOnly?: boolean,
  ) {
    return this.notifications.findMine(user, pagination, unreadOnly ?? false);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'شمار اعلان‌های خوانده‌نشده' })
  countUnread(@CurrentUser() user: RequestUser) {
    return this.notifications.countUnread(user);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'خوانده‌شدن همهٔ اعلان‌ها' })
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'خوانده‌شدن یک اعلان' })
  markRead(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markRead(user, id);
  }
}
