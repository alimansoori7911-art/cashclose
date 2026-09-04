import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { isoToJalali, todayIso } from '@cashclose/shared';

import { TenantId } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MonthlyReportDto, ReportRangeDto } from './dto/report-filters.dto';
import { ForecastService } from './services/forecast.service';
import { OverviewService } from './services/overview.service';
import { ProblematicService } from './services/problematic.service';
import { SalesReportService } from './services/sales-report.service';
import { UnsettledService } from './services/unsettled.service';

/**
 * گزارش‌های مدیریتی.
 *
 * دسترسی برای مدیر مالی، مالک و مدیر فروشگاه — همه فقط خواندنی. طبق
 * بخش ۳ سند، این نقش‌ها هرگز نمی‌توانند داده را تغییر دهند، پس این
 * کنترلر هیچ مسیر نوشتنی ندارد.
 */
@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@Roles(UserRole.owner, UserRole.financial_manager, UserRole.store_manager)
export class ReportsController {
  constructor(
    private readonly sales: SalesReportService,
    private readonly overview: OverviewService,
    private readonly problematicRegisters: ProblematicService,
    private readonly unsettledPurchases: UnsettledService,
    private readonly forecast: ForecastService,
  ) {}

  @Get('daily-sales')
  @ApiOperation({ summary: 'فروش روزانه (فقط صندوق‌های تأییدشده)' })
  dailySales(@TenantId() tenantId: string, @Query() query: ReportRangeDto) {
    return this.sales.dailySales(tenantId, query);
  }

  @Get('branch-comparison')
  @ApiOperation({ summary: 'مقایسهٔ فروش شعبه‌ها' })
  branchComparison(
    @TenantId() tenantId: string,
    @Query() query: ReportRangeDto,
  ) {
    return this.sales.branchComparison(tenantId, query);
  }

  @Get('status-summary')
  @ApiOperation({ summary: 'شمار صندوق‌ها به تفکیک وضعیت' })
  statusSummary(@TenantId() tenantId: string, @Query() query: ReportRangeDto) {
    return this.overview.statusSummary(tenantId, query);
  }

  @Get('surplus-shortage')
  @ApiOperation({ summary: 'گزارش مازاد و کسری صندوق' })
  surplusShortage(
    @TenantId() tenantId: string,
    @Query() query: ReportRangeDto,
  ) {
    return this.overview.surplusShortage(tenantId, query);
  }

  @Get('problematic')
  @ApiOperation({ summary: 'صندوق‌هایی که چند بار رد شده‌اند' })
  problematic(@TenantId() tenantId: string, @Query() query: ReportRangeDto) {
    return this.problematicRegisters.report(tenantId, query);
  }

  @Get('unsettled-purchases')
  @ApiOperation({ summary: 'خریدهای بدون تسویه' })
  unsettled(@TenantId() tenantId: string, @Query() query: ReportRangeDto) {
    return this.unsettledPurchases.report(tenantId, query);
  }

  @Get('monthly-forecast')
  @ApiOperation({ summary: 'پیش‌بینی فروش ماه و مقایسه با سال قبل' })
  monthlyForecast(
    @TenantId() tenantId: string,
    @Query() query: MonthlyReportDto,
  ) {
    return this.forecast.monthlyForecast(tenantId, query);
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: 'روند فروش ۱۲ ماه یک سال شمسی' })
  monthlyTrend(
    @TenantId() tenantId: string,
    @Query() query: MonthlyReportDto,
  ) {
    // تبدیل واقعی تقویم، نه تفریق ۶۲۱: آن تقریب برای ماه‌های پیش از
    // نوروز یک سال اشتباه می‌دهد.
    const currentYear = isoToJalali(todayIso()).jy;

    return this.forecast.monthlyTrend(
      tenantId,
      query.year ?? currentYear,
      query.branchId,
    );
  }
}
