import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { RequestUser } from '../../common/tenant/request-user';
import { ListRegistersDto } from '../cash-registers/dto/list-registers.dto';
import { RegisterMatrixService } from './services/register-matrix.service';

/**
 * نمای جدولی صندوق‌ها.
 *
 * مسیر جدا از `ReviewController` است چون آن کنترلر زیر
 * `cash-registers/:id` قرار دارد و این نما به شناسهٔ یک صندوق وابسته
 * نیست — چند صندوق را کنار هم نشان می‌دهد.
 *
 * مدیر و مالک هم دسترسی دارند: بند ۶ سمت مالک همین نما را بدون
 * قابلیت تأیید/رد می‌خواهد.
 */
@ApiTags('review')
@ApiBearerAuth()
@Controller('registers-matrix')
@Roles(
  UserRole.accountant,
  UserRole.store_manager,
  UserRole.financial_manager,
  UserRole.owner,
)
export class MatrixController {
  constructor(private readonly matrix: RegisterMatrixService) {}

  @Get()
  @ApiOperation({ summary: 'نمای جدولی چند صندوق کنار هم' })
  build(@CurrentUser() user: RequestUser, @Query() query: ListRegistersDto) {
    return this.matrix.build(user, query);
  }
}
