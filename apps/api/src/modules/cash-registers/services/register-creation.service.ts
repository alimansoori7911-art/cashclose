import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestUser } from '../../../common/tenant/request-user';
import { AuditService } from '../../audit/audit.service';
import {
  assertDateAllowed,
  assertNoBlockingRegister,
  assertValidTwoDayRange,
  OPEN_STATUSES,
} from '../cash-register.rules';
import type { CreateCashRegisterDto } from '../dto/create-register.dto';
import { REGISTER_SUMMARY_FIELDS } from './register-fields';

/** ایجاد صندوق روزانه. */
@Injectable()
export class RegisterCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(actor: RequestUser, dto: CreateCashRegisterDto) {
    const branchId = await this.resolveBranch(actor, dto.branchId);

    assertDateAllowed(dto.businessDate);

    if (dto.isTwoDay) {
      if (!dto.coversUntilDate) {
        throw new BadRequestException(
          'برای صندوق دوروزه، تاریخ روز دوم الزامی است.',
        );
      }
      assertValidTwoDayRange(dto.businessDate, dto.coversUntilDate);
    }

    // صندوق‌های بازِ همین صندوقدار در همین شعبه؛ قاعدهٔ «تا نبستن روز
    // قبل، صندوق جدید ممنوع» روی همین‌ها اعمال می‌شود.
    const openRegisters = await this.prisma.cashRegister.findMany({
      where: {
        tenantId: actor.tenantId,
        branchId,
        cashierId: actor.id,
        status: { in: [...OPEN_STATUSES] },
      },
      select: { businessDate: true, status: true },
    });

    assertNoBlockingRegister(openRegisters, dto.businessDate);

    const register = await this.prisma.cashRegister.create({
      data: {
        tenantId: actor.tenantId,
        branchId,
        cashierId: actor.id,
        businessDate: new Date(dto.businessDate),
        coversUntilDate:
          dto.isTwoDay && dto.coversUntilDate
            ? new Date(dto.coversUntilDate)
            : null,
        status: CashRegisterStatus.draft,
      },
      select: REGISTER_SUMMARY_FIELDS,
    });

    await this.prisma.cashRegisterHistory.create({
      data: {
        tenantId: actor.tenantId,
        cashRegisterId: register.id,
        status: CashRegisterStatus.draft,
        createdById: actor.id,
      },
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'cash_register_created',
      entityType: 'cash_register',
      entityId: register.id,
      meta: {
        businessDate: dto.businessDate,
        isTwoDay: Boolean(dto.isTwoDay),
      },
    });

    return register;
  }

  /**
   * تعیین شعبهٔ صندوق.
   *
   * صندوقدار همیشه در شعبهٔ خودش صندوق می‌سازد؛ `branchId` ورودی برای
   * او نادیده گرفته می‌شود تا نتواند در شعبهٔ دیگری صندوق باز کند.
   */
  private async resolveBranch(
    actor: RequestUser,
    requestedBranchId?: string,
  ): Promise<string> {
    if (actor.branchId) return actor.branchId;

    if (!requestedBranchId) {
      throw new BadRequestException(
        'شعبه‌ای به حساب شما تخصیص نیافته است. با مدیر فروشگاه تماس بگیرید.',
      );
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: requestedBranchId, tenantId: actor.tenantId },
      select: { id: true, isActive: true },
    });

    if (!branch) {
      throw new ForbiddenException('دسترسی به این شعبه مجاز نیست.');
    }

    if (!branch.isActive) {
      throw new BadRequestException('این شعبه غیرفعال است.');
    }

    return branch.id;
  }
}
