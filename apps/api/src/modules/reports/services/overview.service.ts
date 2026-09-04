import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ReportRangeDto } from '../dto/report-filters.dto';
import { OPERATIONAL_STATUSES, scopeFilter } from './report-filters';

/** خلاصهٔ وضعیت صندوق‌ها و گزارش مازاد/کسری. */
@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /** شمار صندوق‌ها به تفکیک وضعیت (بند ۱ سمت مالک). */
  async statusSummary(tenantId: string, filters: ReportRangeDto) {
    const grouped = await this.prisma.cashRegister.groupBy({
      by: ['status'],
      where: { tenantId, ...scopeFilter(filters) },
      _count: { id: true },
      _sum: { documentsTotal: true },
    });

    // همهٔ وضعیت‌ها با صفر شروع می‌شوند تا کارت‌های داشبورد هیچ‌وقت
    // خالی نمانند.
    const summary: Record<string, { count: number; sales: bigint }> = {
      draft: { count: 0, sales: 0n },
      submitted: { count: 0, sales: 0n },
      approved: { count: 0, sales: 0n },
      rejected: { count: 0, sales: 0n },
    };

    for (const row of grouped) {
      summary[row.status] = {
        count: row._count.id,
        sales: row._sum.documentsTotal ?? 0n,
      };
    }

    return summary;
  }

  /**
   * مازاد و کسری ثبت‌شده (بند ۲ سمت مالک).
   *
   * بستن صندوق فقط با اختلاف صفر ممکن است، پس مازاد/کسری همیشه به‌صورت
   * **قلم صریح** ثبت می‌شود — و همان چیزی است که مدیر باید ببیند.
   */
  async surplusShortage(tenantId: string, filters: ReportRangeDto) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        type: { in: ['cash_surplus', 'cash_shortage'] },
        amount: { gt: 0 },
        cashRegister: {
          status: { in: [...OPERATIONAL_STATUSES] },
          ...scopeFilter(filters),
        },
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        cashRegister: {
          select: {
            id: true,
            businessDate: true,
            branch: { select: { name: true } },
            cashier: { select: { fullName: true } },
          },
        },
      },
      orderBy: { amount: 'desc' },
      take: 100,
    });

    let surplusTotal = 0n;
    let shortageTotal = 0n;

    for (const item of transactions) {
      if (item.type === 'cash_surplus') surplusTotal += item.amount;
      else shortageTotal += item.amount;
    }

    return {
      surplusTotal,
      shortageTotal,
      netTotal: surplusTotal - shortageTotal,
      items: transactions.map((item) => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        description: item.description,
        registerId: item.cashRegister.id,
        date: item.cashRegister.businessDate.toISOString().slice(0, 10),
        branchName: item.cashRegister.branch.name,
        cashierName: item.cashRegister.cashier.fullName,
      })),
    };
  }
}
