import { Module } from '@nestjs/common';

import { StoresController } from './stores.controller';
import { StoresQuery } from './stores.query';
import { StoresService } from './stores.service';

@Module({
  controllers: [StoresController],
  providers: [StoresService, StoresQuery],
  exports: [StoresService, StoresQuery],
})
export class StoresModule {}
