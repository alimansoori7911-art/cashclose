import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ApproveDto {
  @ApiPropertyOptional({ description: 'یادداشت اختیاری حسابدار' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'یادداشت حداکثر ۱۰۰۰ کاراکتر است.' })
  comment?: string;
}

export class RejectDto {
  /**
   * علت رد — اجباری طبق بند ۱۱.۲ قاعدهٔ ۴.
   *
   * حداقل طول عمدی است: «اشتباه» یا «غلط» به صندوقدار نمی‌گوید چه چیزی
   * را باید اصلاح کند.
   */
  @ApiProperty({ description: 'علت رد (الزامی)' })
  @IsString({ message: 'ثبت علت رد الزامی است.' })
  @MinLength(5, { message: 'علت رد باید حداقل ۵ کاراکتر باشد.' })
  @MaxLength(1000, { message: 'علت رد حداکثر ۱۰۰۰ کاراکتر است.' })
  comment!: string;
}
