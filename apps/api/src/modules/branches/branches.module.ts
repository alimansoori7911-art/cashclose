import { Module } from '@nestjs/common';

import { BranchesController } from './branches.controller';
import { BranchesQuery } from './branches.query';
import { BranchesService } from './branches.service';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService, BranchesQuery],
  exports: [BranchesService, BranchesQuery],
})
export class BranchesModule {}
