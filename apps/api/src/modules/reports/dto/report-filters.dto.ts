import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/**
 * فیلترهای مشترک گزارش‌ها.
 *
 * مثل بقیهٔ مسیرها، هر پارامتر کوئری باید در DTO تعریف شود وگرنه
 * `ValidationPipe` سراسری آن را رد می‌کند.
 */
export class ReportRangeDto {
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

  @ApiPropertyOptional({ description: 'محدودکردن به یک شعبه' })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;
}

/** فیلتر گزارش‌های ماهانه — بر پایهٔ سال و ماه شمسی. */
export class MonthlyReportDto {
  @ApiPropertyOptional({ example: 1405, description: 'سال شمسی' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'سال باید عدد صحیح باشد.' })
  @Min(1300, { message: 'سال شمسی معتبر نیست.' })
  @Max(1500, { message: 'سال شمسی معتبر نیست.' })
  year?: number;

  @ApiPropertyOptional({ example: 6, description: 'ماه شمسی (۱ تا ۱۲)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ماه باید عدد صحیح باشد.' })
  @Min(1, { message: 'ماه باید بین ۱ تا ۱۲ باشد.' })
  @Max(12, { message: 'ماه باید بین ۱ تا ۱۲ باشد.' })
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;
}
