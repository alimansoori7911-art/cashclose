import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from '../../../common/pagination/pagination.dto';

/** فیلترهای فهرست شعبه‌ها. */
export class ListBranchesDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(undefined, { message: 'شناسهٔ فروشگاه معتبر نیست.' })
  storeId?: string;
}
