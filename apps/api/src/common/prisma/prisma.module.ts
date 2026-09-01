import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** سرویس دیتابیس در کل برنامه در دسترس است. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
