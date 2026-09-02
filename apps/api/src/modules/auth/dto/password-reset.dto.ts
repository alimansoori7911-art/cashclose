import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'cashier1', description: 'نام کاربری' })
  @IsString({ message: 'نام کاربری الزامی است.' })
  @MaxLength(80)
  username!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'توکن دریافتی از لینک بازیابی' })
  @IsString({ message: 'توکن الزامی است.' })
  @MaxLength(200)
  token!: string;

  @ApiProperty({ example: 'NewPass@1404', description: 'رمز عبور جدید' })
  @IsString({ message: 'رمز عبور جدید الزامی است.' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر است.' })
  @MaxLength(200, { message: 'رمز عبور حداکثر ۲۰۰ کاراکتر است.' })
  // حداقل یک حرف و یک رقم — سدی در برابر رمزهای بسیار ساده بدون اینکه
  // کاربر را با قواعد پیچیده خسته کند.
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'رمز عبور باید حداقل شامل یک حرف و یک رقم باشد.',
  })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'رمز عبور فعلی' })
  @IsString({ message: 'رمز عبور فعلی الزامی است.' })
  @MaxLength(200)
  currentPassword!: string;

  @ApiProperty({ description: 'رمز عبور جدید' })
  @IsString({ message: 'رمز عبور جدید الزامی است.' })
  @MinLength(8, { message: 'رمز عبور حداقل ۸ کاراکتر است.' })
  @MaxLength(200)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'رمز عبور باید حداقل شامل یک حرف و یک رقم باشد.',
  })
  newPassword!: string;
}
