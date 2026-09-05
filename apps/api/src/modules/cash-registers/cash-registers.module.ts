import { Module } from '@nestjs/common';

import { CashRegistersController } from './cash-registers.controller';
import { RegisterCalculationService } from './services/register-calculation.service';
import { RegisterCloseService } from './services/register-close.service';
import { RegisterCreationService } from './services/register-creation.service';
import { RegisterDraftService } from './services/register-draft.service';
import { RegisterQueryService } from './services/register-query.service';
import { TerminalGuardService } from './services/terminal-guard.service';

@Module({
  controllers: [CashRegistersController],
  providers: [
    RegisterQueryService,
    RegisterCreationService,
    RegisterDraftService,
    RegisterCloseService,
    RegisterCalculationService,
    TerminalGuardService,
  ],
  exports: [RegisterQueryService, RegisterCalculationService],
})
export class CashRegistersModule {}
