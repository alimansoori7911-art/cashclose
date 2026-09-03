import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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

  /**
   * شناسهٔ مجموعه.
   *
   * چون نام کاربری فقط **درون** هر مستأجر یکتاست، دو مجموعه می‌توانند
   * کاربری با نام یکسان داشته باشند. اگر این مقدار داده نشود و نام
   * کاربری در بیش از یک مجموعه وجود داشته باشد، ورود رد می‌شود — چون
   * انتخاب دلبخواهی یکی از آن‌ها یعنی کاربر ممکن است به مجموعهٔ اشتباه
   * وارد شود.
   */
  @ApiPropertyOptional({ description: 'شناسهٔ مجموعه (در صورت تکراری‌بودن نام کاربری)' })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ مجموعه معتبر نیست.' })
  tenantId?: string;
}
