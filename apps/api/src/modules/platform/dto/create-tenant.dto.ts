import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** ساخت مجموعهٔ کسب‌وکار تازه به‌همراه حساب مالک آن. */
export class CreateTenantDto {
  @ApiProperty({ example: 'فروشگاه رفاه' })
  @IsString()
  @MinLength(2, { message: 'نام کسب‌وکار حداقل ۲ نویسه است.' })
  @MaxLength(200, { message: 'نام کسب‌وکار حداکثر ۲۰۰ نویسه است.' })
  name!: string;

  /**
   * زیردامنهٔ اختصاصی.
   *
   * دستی گرفته می‌شود نه خودکار از نام: نام فارسی زیردامنهٔ معتبر
   * نمی‌سازد و حدس‌زدن، آدرسی بی‌معنا تولید می‌کند.
   */
  @ApiProperty({ example: 'refah' })
  @IsString()
  @Matches(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, {
    message: 'شناسهٔ آدرس فقط حروف کوچک لاتین، رقم و خط تیره.',
  })
  slug!: string;

  @ApiPropertyOptional({ description: 'اگر خالی بماند، نام کسب‌وکار.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  storeName?: string;

  @ApiProperty({ example: 'رضا رفاهی' })
  @IsString()
  @MinLength(3, { message: 'نام مالک حداقل ۳ نویسه است.' })
  @MaxLength(120)
  ownerFullName!: string;

  @ApiProperty({ example: 'owner' })
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,80}$/, {
    message: 'نام کاربری فقط حروف لاتین، رقم، نقطه، خط تیره و زیرخط.',
  })
  ownerUsername!: string;

  @ApiProperty({ description: 'رمز اولیهٔ مالک' })
  @IsString()
  @MinLength(8, { message: 'رمز عبور حداقل ۸ نویسه است.' })
  @MaxLength(128)
  ownerPassword!: string;
}

/** ورود مدیر سامانه. */
export class PlatformLoginDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  username!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  password!: string;
}

/** بازنشانی رمز مالک توسط مدیر سامانه. */
export class ResetOwnerPasswordDto {
  @ApiProperty({ description: 'شناسهٔ کاربرِ مالک' })
  @IsUUID(undefined, { message: 'شناسهٔ کاربر معتبر نیست.' })
  userId!: string;

  @ApiProperty({ description: 'رمز تازه' })
  @IsString()
  @MinLength(8, { message: 'رمز عبور حداقل ۸ نویسه است.' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'رمز عبور باید حداقل شامل یک حرف و یک رقم باشد.',
  })
  newPassword!: string;
}
