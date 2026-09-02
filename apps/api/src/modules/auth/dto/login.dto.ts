import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'cashier1', description: 'نام کاربری' })
  @IsString({ message: 'نام کاربری الزامی است.' })
  @MinLength(3, { message: 'نام کاربری حداقل ۳ کاراکتر است.' })
  @MaxLength(80, { message: 'نام کاربری حداکثر ۸۰ کاراکتر است.' })
  username!: string;

  @ApiProperty({ example: 'Cashclose@1404', description: 'رمز عبور' })
  @IsString({ message: 'رمز عبور الزامی است.' })
  @MaxLength(200, { message: 'رمز عبور حداکثر ۲۰۰ کاراکتر است.' })
  password!: string;
}
