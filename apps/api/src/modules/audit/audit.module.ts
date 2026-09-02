import { Global, Module } from '@nestjs/common';

import { AuditService } from './audit.service';

/** سرویس ممیزی تقریباً در همهٔ ماژول‌ها لازم می‌شود. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
