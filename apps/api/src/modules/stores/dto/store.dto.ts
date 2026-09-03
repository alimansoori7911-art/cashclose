import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'فروشگاه رهاوی' })
  @IsString({ message: 'نام فروشگاه الزامی است.' })
  @MinLength(2, { message: 'نام فروشگاه حداقل ۲ کاراکتر است.' })
  @MaxLength(200, { message: 'نام فروشگاه حداکثر ۲۰۰ کاراکتر است.' })
  name!: string;

  @ApiPropertyOptional({ example: 'تهران، خیابان ولیعصر' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'نشانی حداکثر ۵۰۰ کاراکتر است.' })
  address?: string;

  @ApiPropertyOptional({ example: '02112345678' })
  @IsOptional()
  @IsString()
  // ارقام، فاصله و خط تیره؛ شمارهٔ ثابت و همراه هر دو پذیرفته می‌شوند.
  @Matches(/^[\d\s-]{4,20}$/, {
    message: 'شمارهٔ تماس معتبر نیست.',
  })
  phone?: string;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiPropertyOptional({ description: 'غیرفعال‌کردن به‌جای حذف' })
  @IsOptional()
  @IsBoolean({ message: 'وضعیت فعال‌بودن باید بله/خیر باشد.' })
  isActive?: boolean;
}
