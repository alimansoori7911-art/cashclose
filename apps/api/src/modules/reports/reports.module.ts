import { Module } from '@nestjs/common';

import { ReportsController } from './reports.controller';
import { ForecastService } from './services/forecast.service';
import { OverviewService } from './services/overview.service';
import { ProblematicService } from './services/problematic.service';
import { SalesReportService } from './services/sales-report.service';
import { UnsettledService } from './services/unsettled.service';

@Module({
  controllers: [ReportsController],
  providers: [
    SalesReportService,
    OverviewService,
    ProblematicService,
    UnsettledService,
    ForecastService,
  ],
  exports: [SalesReportService, ForecastService],
})
export class ReportsModule {}
