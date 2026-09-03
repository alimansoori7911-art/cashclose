import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'علی احمدی' })
  @IsString({ message: 'نام و نام خانوادگی الزامی است.' })
  @MinLength(2, { message: 'نام حداقل ۲ کاراکتر است.' })
  @MaxLength(120, { message: 'نام حداکثر ۱۲۰ کاراکتر است.' })
  fullName!: string;

  @ApiProperty({ example: 'cashier3' })
  @IsString({ message: 'نام کاربری الزامی است.' })
  @MinLength(3, { message: 'نام کاربری حداقل ۳ کاراکتر است.' })
  @MaxLength(80, { message: 'نام کاربری حداکثر ۸۰ کاراکتر است.' })
  // فقط حروف لاتین، رقم، نقطه، خط تیره و زیرخط — نام کاربری فارسی
  // هنگام تایپ با کیبوردهای مختلف دردسرساز می‌شود.
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'نام کاربری فقط می‌تواند شامل حروف لاتین، رقم، نقطه، خط تیره و زیرخط باشد.',
  })
  username!: string;

  @ApiProperty({ example: 'Cashclose@1404' })
  @IsString({ message: 'رمز عبور الزامی است.' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر است.' })
  @MaxLength(200, { message: 'رمز عبور حداکثر ۲۰۰ کاراکتر است.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'رمز عبور باید حداقل شامل یک حرف و یک رقم باشد.',
  })
  password!: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole, { message: 'نقش انتخاب‌شده معتبر نیست.' })
  role!: UserRole;

  @ApiPropertyOptional({ description: 'برای صندوقدار الزامی است' })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;
}

/**
 * رمز عبور عمداً اینجا نیست: تغییر رمز کاربر دیگر مسیر جداگانه‌ای
 * دارد تا با ویرایش معمولی پروفایل قاطی نشود و در لاگ هم متمایز بماند.
 */
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'نام حداقل ۲ کاراکتر است.' })
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'نقش انتخاب‌شده معتبر نیست.' })
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'وضعیت انتخاب‌شده معتبر نیست.' })
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;
}

export class ResetUserPasswordDto {
  @ApiProperty({ description: 'رمز عبور جدید' })
  @IsString({ message: 'رمز عبور جدید الزامی است.' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر است.' })
  @MaxLength(200)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'رمز عبور باید حداقل شامل یک حرف و یک رقم باشد.',
  })
  newPassword!: string;
}
