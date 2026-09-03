import { Module } from '@nestjs/common';

import { PosTerminalsController } from './pos-terminals.controller';
import { PosTerminalsQuery } from './pos-terminals.query';
import { PosTerminalsService } from './pos-terminals.service';

@Module({
  controllers: [PosTerminalsController],
  providers: [PosTerminalsService, PosTerminalsQuery],
  exports: [PosTerminalsService, PosTerminalsQuery],
})
export class PosTerminalsModule {}
