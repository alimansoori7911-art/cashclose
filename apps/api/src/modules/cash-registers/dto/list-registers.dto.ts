import { ApiPropertyOptional } from '@nestjs/swagger';
import { CashRegisterStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { MAX_AMOUNT } from '@cashclose/shared';

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

  /**
   * فیلتر بر اساس مبلغ (بند ۹ سند: «بر اساس فیلتر با مبلغ خاص یا بازه»).
   *
   * روی **جمع اسناد** اعمال می‌شود، چون همان عددی است که حسابدار هنگام
   * جست‌وجوی یک صندوق مشخص در ذهن دارد.
   */
  @ApiPropertyOptional({ example: 10_000_000, description: 'حداقل جمع اسناد' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'حداقل مبلغ باید عدد صحیح باشد.' })
  @Min(0, { message: 'مبلغ نمی‌تواند منفی باشد.' })
  @Max(MAX_AMOUNT, { message: 'مبلغ بیش از حد مجاز است.' })
  amountMin?: number;

  @ApiPropertyOptional({ example: 50_000_000, description: 'حداکثر جمع اسناد' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'حداکثر مبلغ باید عدد صحیح باشد.' })
  @Min(0, { message: 'مبلغ نمی‌تواند منفی باشد.' })
  @Max(MAX_AMOUNT, { message: 'مبلغ بیش از حد مجاز است.' })
  amountMax?: number;

  /**
   * فقط صندوق‌هایی که مازاد یا کسری داشته‌اند.
   *
   * بستن صندوق فقط با اختلاف صفر ممکن است، پس مازاد/کسری همیشه به‌صورت
   * قلم صریح ثبت می‌شود — این فیلتر همان‌ها را پیدا می‌کند.
   */
  @ApiPropertyOptional({ description: 'فقط صندوق‌های دارای مازاد یا کسری' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onlyWithDiscrepancy?: boolean;
}
