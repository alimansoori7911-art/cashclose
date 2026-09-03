import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { MAX_AMOUNT } from '@cashclose/shared';

/** یک ردیف تراکنش در فرم صندوق. */
export class TransactionInputDto {
  /**
   * شناسهٔ ردیف موجود.
   *
   * اگر داده شود، همان رکورد به‌روزرسانی می‌شود به‌جای اینکه حذف و
   * دوباره ساخته شود — بدون این، تصاویر پیوست‌شده به تراکنش با هر
   * ذخیرهٔ خودکار از بین می‌رفتند (رابطهٔ uploads آبشاری است).
   */
  @ApiPropertyOptional({ description: 'شناسهٔ ردیف موجود (برای حفظ تصاویر)' })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ تراکنش معتبر نیست.' })
  id?: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType, { message: 'نوع تراکنش معتبر نیست.' })
  type!: TransactionType;

  @ApiProperty({ example: 1_500_000, description: 'مبلغ به ریال' })
  @Type(() => Number)
  @IsInt({ message: 'مبلغ باید عدد صحیح باشد.' })
  // مبلغ صفر مجاز است: صندوقدار می‌تواند کارتخوانی را بدون مبلغ رها کند
  // (بند ۹.۷ سند). علامت قلم از نوع آن می‌آید، نه از علامت عدد.
  @Min(0, { message: 'مبلغ نمی‌تواند منفی باشد.' })
  @Max(MAX_AMOUNT, { message: 'مبلغ بیش از حد مجاز است.' })
  amount!: number;

  @ApiPropertyOptional({ description: 'حداکثر ۳۰۰ کاراکتر' })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'توضیح حداکثر ۳۰۰ کاراکتر است.' })
  description?: string;

  @ApiPropertyOptional({ description: 'برای کارتخوان و کارت‌به‌کارت' })
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ کارتخوان معتبر نیست.' })
  terminalId?: string;

  /** ترتیب نمایش ردیف در فرم. */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveDraftDto {
  /**
   * فهرست کامل تراکنش‌ها.
   *
   * جایگزینی کامل است نه افزایشی: فرم همیشه وضعیت نهایی را می‌فرستد، پس
   * حذف یک ردیف در UI به‌سادگی یعنی نبودنش در این آرایه.
   */
  @ApiProperty({ type: [TransactionInputDto] })
  @IsArray({ message: 'ساختار تراکنش‌ها معتبر نیست.' })
  // سقف دفاعی: هر صندوق واقعی بسیار کمتر از این دارد؛ این فقط جلوی
  // درخواست‌های مخرب حجیم را می‌گیرد.
  @ArrayMaxSize(500, { message: 'تعداد ردیف‌ها بیش از حد مجاز است.' })
  @ValidateNested({ each: true })
  @Type(() => TransactionInputDto)
  transactions!: TransactionInputDto[];

  @ApiPropertyOptional({ description: 'یادداشت پایانی صندوقدار' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'یادداشت حداکثر ۱۰۰۰ کاراکتر است.' })
  finalNotes?: string;
}
