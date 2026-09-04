import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/**
 * فیلترهای فهرست کارتخوان‌ها.
 *
 * این فهرست صفحه‌بندی ندارد چون تعداد دستگاه‌های یک شعبه همیشه اندک
 * است و صندوقدار باید همه را یکجا در فرم ببیند.
 */
export class ListTerminalsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;

  @ApiPropertyOptional({ description: 'فقط دستگاه‌های فعال' })
  @IsOptional()
  // پارامتر کوئری همیشه رشته است؛ باید صریح به boolean تبدیل شود.
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}
