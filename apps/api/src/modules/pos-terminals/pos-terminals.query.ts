import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import type { RequestUser } from '../../common/tenant/request-user';

export const TERMINAL_FIELDS = {
  id: true,
  name: true,
  bank: true,
  cardNumber: true,
  isActive: true,
  branchId: true,
  assignedToId: true,
  createdAt: true,
  branch: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, fullName: true } },
} as const;

/** خواندن کارتخوان‌ها. */
@Injectable()
export class PosTerminalsQuery {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * فهرست کارتخوان‌ها.
   *
   * صندوقدار فقط دستگاه‌های شعبهٔ خودش را می‌بیند — بند تست فاز ۲ سند.
   * کارتخوان به شعبه تعلق دارد نه به شخص، چون شیفت صبح و عصر از یک
   * دستگاه استفاده می‌کنند.
   */
  async findAll(actor: RequestUser, branchId?: string, activeOnly = false) {
    const scopedBranch =
      actor.role === UserRole.cashier ? actor.branchId : branchId;

    if (actor.role === UserRole.cashier && !actor.branchId) {
      throw new ForbiddenException('شعبه‌ای به حساب شما تخصیص نیافته است.');
    }

    return this.prisma.posTerminal.findMany({
      where: {
        tenantId: actor.tenantId,
        ...(scopedBranch ? { branchId: scopedBranch } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      select: TERMINAL_FIELDS,
      orderBy: [{ branchId: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const terminal = await this.prisma.posTerminal.findFirst({
      where: { id, tenantId },
      select: TERMINAL_FIELDS,
    });

    if (!terminal) throw new NotFoundException('دستگاه کارتخوان یافت نشد.');
    return terminal;
  }
}
