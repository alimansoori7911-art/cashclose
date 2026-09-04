import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { ReportRangeDto } from '../dto/report-filters.dto';
import { OPERATIONAL_STATUSES, scopeFilter } from './report-filters';

/**
 * خریدهای بدون تسویه (بند ۵ سمت مالک).
 *
 * برخلاف گزارش‌های فروش، صندوق‌های در انتظار بررسی هم شمرده می‌شوند:
 * بدهی مشتری واقعیتی است که مدیر باید از آن خبر داشته باشد، حتی اگر
 * صندوقش هنوز تأیید نشده باشد.
 */
@Injectable()
export class UnsettledService {
  constructor(private readonly prisma: PrismaService) {}

  async report(tenantId: string, filters: ReportRangeDto) {
    const items = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        type: 'unsettled_purchase',
        amount: { gt: 0 },
        cashRegister: {
          status: { in: [...OPERATIONAL_STATUSES] },
          ...scopeFilter(filters),
        },
      },
      select: {
        id: true,
        amount: true,
        description: true,
        cashRegister: {
          select: {
            businessDate: true,
            status: true,
            branch: { select: { name: true } },
            cashier: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      // سقف دفاعی: فهرست بدهی طولانی‌تر از این در UI هم قابل استفاده نیست.
      take: 200,
    });

    const total = items.reduce((sum, item) => sum + item.amount, 0n);

    return {
      total,
      count: items.length,
      items: items.map((item) => ({
        id: item.id,
        amount: item.amount,
        description: item.description,
        date: item.cashRegister.businessDate.toISOString().slice(0, 10),
        branchName: item.cashRegister.branch.name,
        cashierName: item.cashRegister.cashier.fullName,
        registerStatus: item.cashRegister.status,
      })),
    };
  }
}
