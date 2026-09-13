import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

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
import {
  buildRegisterWhere,
  type RegisterFilters,
} from './register-filters';

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
    filters: RegisterFilters = {},
  ): Promise<PaginatedResult<unknown>> {
    const where = buildRegisterWhere(actor, filters);

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

  /**
   * اقلام صندوق قبلیِ همین صندوقدار.
   *
   * برای راهنمای رفع اختلاف: قلمی که دیروز مبلغ داشت و امروز خالی است،
   * شایع‌ترین نشانهٔ «فراموش‌کردن یک دستگاه» است. فقط جمع هر نوع لازم
   * است، نه جزئیات.
   */
  async findPreviousTransactions(actor: RequestUser, beforeId: string) {
    const current = await this.prisma.cashRegister.findFirst({
      where: { id: beforeId, tenantId: actor.tenantId },
      select: { businessDate: true, cashierId: true },
    });

    if (!current) return [];

    const previous = await this.prisma.cashRegister.findFirst({
      where: {
        tenantId: actor.tenantId,
        cashierId: current.cashierId,
        businessDate: { lt: current.businessDate },
      },
      select: {
        transactions: {
          select: { type: true, amount: true },
        },
      },
      orderBy: { businessDate: 'desc' },
    });

    return previous?.transactions ?? [];
  }
}
