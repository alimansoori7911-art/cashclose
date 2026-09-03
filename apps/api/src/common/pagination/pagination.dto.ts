import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * پارامترهای صفحه‌بندی — بند ۹.۹ سند.
 *
 * سقف `limit` عمدی است: بدون آن، یک درخواست با `limit=1000000` می‌تواند
 * کل جدول را بخواند و سرویس را از کار بیندازد.
 */
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شمارهٔ صفحه باید عدد صحیح باشد.' })
  @Min(1, { message: 'شمارهٔ صفحه باید حداقل ۱ باشد.' })
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد در صفحه باید عدد صحیح باشد.' })
  @Min(1, { message: 'تعداد در صفحه باید حداقل ۱ باشد.' })
  @Max(100, { message: 'تعداد در صفحه حداکثر ۱۰۰ است.' })
  limit: number = 20;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export function paginate<T>(
  items: T[],
  totalItems: number,
  { page, limit }: { page: number; limit: number },
): PaginatedResult<T> {
  return {
    items,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    totalItems,
  };
}
