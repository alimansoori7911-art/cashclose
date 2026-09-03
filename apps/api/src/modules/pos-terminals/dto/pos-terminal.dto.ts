import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePosTerminalDto {
  @ApiProperty({ description: 'شناسهٔ شعبه' })
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId!: string;

  @ApiProperty({ example: 'کارتخوان ۱' })
  @IsString({ message: 'نام دستگاه الزامی است.' })
  @MinLength(2, { message: 'نام دستگاه حداقل ۲ کاراکتر است.' })
  @MaxLength(100, { message: 'نام دستگاه حداکثر ۱۰۰ کاراکتر است.' })
  name!: string;

  @ApiPropertyOptional({ example: 'سامان' })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'نام بانک حداکثر ۱۰۰ کاراکتر است.' })
  bank?: string;

  @ApiPropertyOptional({ example: '6037991234567891', description: 'شمارهٔ کارت ۱۶ رقمی' })
  @IsOptional()
  @IsString()
  // بند ۹.۷ سند: شمارهٔ کارت ۱۶ رقم و فقط عدد.
  @Matches(/^\d{16}$/, {
    message: 'شمارهٔ کارت باید دقیقاً ۱۶ رقم باشد.',
  })
  cardNumber?: string;
}

/**
 * جابه‌جایی دستگاه بین شعبه‌ها مجاز نیست: تراکنش‌های ثبت‌شده به دستگاه
 * وابسته‌اند و تغییر شعبهٔ آن، گزارش‌های تاریخی شعبه را مخدوش می‌کند.
 */
export class UpdatePosTerminalDto extends PartialType(
  OmitType(CreatePosTerminalDto, ['branchId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعال‌بودن باید بله/خیر باشد.' })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'صندوقدار مسئول (اختیاری)' })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ کاربر معتبر نیست.' })
  assignedToId?: string;
}
