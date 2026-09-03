import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CashRegisterStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  paginate,
  type PaginatedResult,
  type PaginationDto,
} from '../../../common/pagination/pagination.dto';
import type { RequestUser } from '../../../common/tenant/request-user';
import { OPEN_STATUSES } from '../cash-register.rules';
import {
  REGISTER_DETAIL_FIELDS,
  REGISTER_SUMMARY_FIELDS,
} from './register-fields';

@Injectable()
export class RegisterQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * فهرست صندوق‌ها.
   *
   * صندوقدار فقط صندوق‌های خودش را می‌بیند؛ بقیهٔ نقش‌ها کل مستأجر را.
   * این محدودیت در همین لایه اعمال می‌شود تا فراموش‌کردنش در کنترلر
   * ممکن نباشد.
   */
  async findAll(
    actor: RequestUser,
    pagination: PaginationDto,
    filters: {
      status?: CashRegisterStatus;
      branchId?: string;
      cashierId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ): Promise<PaginatedResult<unknown>> {
    const where = {
      tenantId: actor.tenantId,
      ...(actor.role === UserRole.cashier ? { cashierId: actor.id } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.cashierId && actor.role !== UserRole.cashier
        ? { cashierId: filters.cashierId }
        : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            businessDate: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashRegister.findMany({
        where,
        select: REGISTER_SUMMARY_FIELDS,
        orderBy: { businessDate: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.cashRegister.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  /** جزئیات کامل صندوق به‌همراه تراکنش‌ها و تاریخچه. */
  async findOne(actor: RequestUser, id: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: REGISTER_DETAIL_FIELDS,
    });

    if (!register) throw new NotFoundException('صندوق یافت نشد.');

    if (
      actor.role === UserRole.cashier &&
      register.cashierId !== actor.id
    ) {
      throw new ForbiddenException('دسترسی به صندوق دیگران مجاز نیست.');
    }

    return register;
  }

  /** صندوق باز فعلی صندوقدار — برای داشبورد. */
  async findOpenForCashier(actor: RequestUser) {
    return this.prisma.cashRegister.findFirst({
      where: {
        tenantId: actor.tenantId,
        cashierId: actor.id,
        status: { in: [...OPEN_STATUSES] },
      },
      select: REGISTER_SUMMARY_FIELDS,
      orderBy: { businessDate: 'desc' },
    });
  }
}
