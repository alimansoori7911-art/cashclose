import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: 'شناسهٔ فروشگاه' })
  @IsUUID(undefined, { message: 'شناسهٔ فروشگاه معتبر نیست.' })
  storeId!: string;

  @ApiProperty({ example: 'شعبهٔ ونک' })
  @IsString({ message: 'نام شعبه الزامی است.' })
  @MinLength(2, { message: 'نام شعبه حداقل ۲ کاراکتر است.' })
  @MaxLength(200, { message: 'نام شعبه حداکثر ۲۰۰ کاراکتر است.' })
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'نشانی حداکثر ۵۰۰ کاراکتر است.' })
  address?: string;
}

/**
 * جابه‌جایی شعبه بین فروشگاه‌ها مجاز نیست: صندوق‌های ثبت‌شده به شعبه
 * وابسته‌اند و تغییر فروشگاهِ آن، گزارش‌های تاریخی را بی‌معنا می‌کند.
 */
export class UpdateBranchDto extends PartialType(
  OmitType(CreateBranchDto, ['storeId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعال‌بودن باید بله/خیر باشد.' })
  isActive?: boolean;
}
