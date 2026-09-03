import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateCashRegisterDto {
  @ApiProperty({ example: '2026-09-02', description: 'تاریخ کاری صندوق' })
  @IsISO8601(
    { strict: true },
    { message: 'تاریخ باید به قالب YYYY-MM-DD باشد.' },
  )
  businessDate!: string;

  @ApiPropertyOptional({ description: 'برای صندوقدارِ چندشعبه‌ای' })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;

  /**
   * صندوق دوروزه (بند ۱۱ سند).
   *
   * `coversUntilDate` فقط وقتی معنا دارد که این پرچم روشن باشد؛ نگه
   * داشتن هر دو، قصد کاربر را صریح می‌کند و از فعال‌شدن تصادفی این حالت
   * جلوگیری می‌کند.
   */
  @ApiPropertyOptional({ description: 'بستن دو روز همزمان' })
  @IsOptional()
  @IsBoolean({ message: 'مقدار باید بله/خیر باشد.' })
  isTwoDay?: boolean;

  @ApiPropertyOptional({ example: '2026-09-03', description: 'روز دوم' })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'تاریخ پایان باید به قالب YYYY-MM-DD باشد.' },
  )
  coversUntilDate?: string;
}
