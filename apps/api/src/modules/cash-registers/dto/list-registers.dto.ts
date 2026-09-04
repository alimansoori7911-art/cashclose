import { ApiPropertyOptional } from '@nestjs/swagger';
import { CashRegisterStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

/**
 * فیلترهای فهرست صندوق (بند AC6 سند).
 *
 * چرا DTO لازم است: `ValidationPipe` سراسری با `forbidNonWhitelisted`
 * اجرا می‌شود و هر پارامتری که در DTO تعریف نشده باشد را رد می‌کند.
 * خواندن با `@Query('status')` جداگانه کافی نیست.
 */
export class ListRegistersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CashRegisterStatus })
  @IsOptional()
  @IsEnum(CashRegisterStatus, { message: 'وضعیت انتخاب‌شده معتبر نیست.' })
  status?: CashRegisterStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ صندوقدار معتبر نیست.' })
  cashierId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'تاریخ شروع باید به قالب YYYY-MM-DD باشد.' },
  )
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'تاریخ پایان باید به قالب YYYY-MM-DD باشد.' },
  )
  dateTo?: string;
}
