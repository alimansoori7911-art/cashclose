import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ReportRangeDto } from '../dto/report-filters.dto';
import { approvedSalesFilter } from './report-filters';

/**
 * گزارش‌های فروش.
 *
 * همهٔ متدها فقط صندوق‌های تأییدشده را می‌شمارند — قاعدهٔ بند ۱۱.۷ سند
 * که در `approvedSalesFilter` متمرکز شده است.
 */
@Injectable()
export class SalesReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * فروش روزانه.
   *
   * «فروش» در این گزارش یعنی جمع اسناد — پول واقعی که وارد صندوق شده
   * است، نه ماندهٔ محاسباتی.
   */
  async dailySales(tenantId: string, filters: ReportRangeDto) {
    const registers = await this.prisma.cashRegister.findMany({
      where: approvedSalesFilter(tenantId, filters),
      select: {
        businessDate: true,
        documentsTotal: true,
        registerBalance: true,
        difference: true,
      },
      orderBy: { businessDate: 'asc' },
    });

    // چند صندوق در یک روز (شیفت صبح و عصر) باید با هم جمع شوند.
    const byDate = new Map<
      string,
      { sales: bigint; balance: bigint; difference: bigint; count: number }
    >();

    for (const item of registers) {
      const key = item.businessDate.toISOString().slice(0, 10);
      const current = byDate.get(key) ?? {
        sales: 0n,
        balance: 0n,
        difference: 0n,
        count: 0,
      };

      byDate.set(key, {
        sales: current.sales + item.documentsTotal,
        balance: current.balance + item.registerBalance,
        difference: current.difference + item.difference,
        count: current.count + 1,
      });
    }

    return [...byDate.entries()].map(([date, values]) => ({
      date,
      sales: values.sales,
      registerBalance: values.balance,
      difference: values.difference,
      registerCount: values.count,
    }));
  }

  /** مقایسهٔ شعبه‌ها (بند ۹ سمت مالک). */
  async branchComparison(tenantId: string, filters: ReportRangeDto) {
    const grouped = await this.prisma.cashRegister.groupBy({
      by: ['branchId'],
      where: approvedSalesFilter(tenantId, filters),
      _sum: { documentsTotal: true, difference: true },
      _count: { id: true },
    });

    const branches = await this.prisma.branch.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    const nameById = new Map(branches.map((b) => [b.id, b.name]));

    return grouped
      .map((row) => ({
        branchId: row.branchId,
        branchName: nameById.get(row.branchId) ?? 'نامشخص',
        sales: row._sum.documentsTotal ?? 0n,
        difference: row._sum.difference ?? 0n,
        registerCount: row._count.id,
      }))
      .sort((a, b) => (b.sales > a.sales ? 1 : b.sales < a.sales ? -1 : 0));
  }
}
