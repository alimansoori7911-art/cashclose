import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

/** فیلترهای فهرست لاگ عملیات. */
export class ListLogsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'login_success' })
  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'نام رویداد بیش از حد بلند است.' })
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ کاربر معتبر نیست.' })
  userId?: string;

  @ApiPropertyOptional({ example: 'cash_register' })
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'نوع موجودیت بیش از حد بلند است.' })
  entityType?: string;
}
