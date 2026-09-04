import { Injectable } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ReportRangeDto } from '../dto/report-filters.dto';
import { scopeFilter } from './report-filters';

/**
 * صندوق‌هایی که چند بار رد شده‌اند (بند ۱ سمت مالک).
 *
 * تعداد دفعات رد از تاریخچه شمرده می‌شود؛ عدد بالا یعنی یا صندوقدار
 * آموزش لازم دارد یا فرایندی مشکل دارد.
 */
@Injectable()
export class ProblematicService {
  /** آستانهٔ «مشکل‌دار» — کمتر از این، رد عادی محسوب می‌شود. */
  private static readonly MIN_REJECTIONS = 2;

  constructor(private readonly prisma: PrismaService) {}

  async report(tenantId: string, filters: ReportRangeDto) {
    const rejections = await this.prisma.cashRegisterHistory.groupBy({
      by: ['cashRegisterId'],
      where: {
        tenantId,
        status: CashRegisterStatus.rejected,
        cashRegister: scopeFilter(filters),
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: ProblematicService.MIN_REJECTIONS } },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    });

    if (rejections.length === 0) return [];

    const registers = await this.prisma.cashRegister.findMany({
      where: { id: { in: rejections.map((r) => r.cashRegisterId) } },
      select: {
        id: true,
        businessDate: true,
        status: true,
        documentsTotal: true,
        branch: { select: { name: true } },
        cashier: { select: { fullName: true } },
      },
    });

    const countById = new Map(
      rejections.map((r) => [r.cashRegisterId, r._count.id]),
    );

    return registers
      .map((register) => ({
        id: register.id,
        date: register.businessDate.toISOString().slice(0, 10),
        status: register.status,
        sales: register.documentsTotal,
        branchName: register.branch.name,
        cashierName: register.cashier.fullName,
        rejectionCount: countById.get(register.id) ?? 0,
      }))
      .sort((a, b) => b.rejectionCount - a.rejectionCount);
  }
}
