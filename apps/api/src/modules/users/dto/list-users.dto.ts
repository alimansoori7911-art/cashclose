import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

/**
 * فیلترهای فهرست کاربران.
 *
 * `ValidationPipe` سراسری با `forbidNonWhitelisted` اجرا می‌شود، پس هر
 * پارامتر کوئری باید اینجا تعریف شود وگرنه درخواست با ۴۰۰ رد می‌گردد.
 */
export class ListUsersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'نقش انتخاب‌شده معتبر نیست.' })
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ شعبه معتبر نیست.' })
  branchId?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'وضعیت انتخاب‌شده معتبر نیست.' })
  status?: UserStatus;
}
