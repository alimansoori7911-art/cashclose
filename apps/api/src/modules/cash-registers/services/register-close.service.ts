import { ForbiddenException, Injectable } from '@nestjs/common';
import { CashRegisterStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestUser } from '../../../common/tenant/request-user';
import { AuditService } from '../../audit/audit.service';
import { assertCanClose } from '../cash-register.rules';
import { RegisterCalculationService } from './register-calculation.service';

/** بستن صندوق و ارسال برای حسابدار. */
@Injectable()
export class RegisterCloseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculation: RegisterCalculationService,
    private readonly audit: AuditService,
  ) {}

  /**
   * بستن صندوق.
   *
   * اختلاف **دوباره سمت سرور** محاسبه می‌شود، نه از مقدار ذخیره‌شده:
   * بین آخرین ذخیره و لحظهٔ بستن ممکن است چیزی عوض شده باشد، و اجازهٔ
   * بستن باید بر پایهٔ واقعیتِ همان لحظه باشد.
   */
  async close(actor: RequestUser, id: string) {
    const register = await this.loadOwned(actor, id);
    const result = await this.calculation.recalculateAndSave(id);

    assertCanClose(register.status, result.difference);

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.cashRegister.update({
        where: { id },
        data: {
          status: CashRegisterStatus.submitted,
          submittedAt: now,
        },
      });

      await tx.cashRegisterHistory.create({
        data: {
          tenantId: actor.tenantId,
          cashRegisterId: id,
          status: CashRegisterStatus.submitted,
          createdById: actor.id,
        },
      });

      await this.saveVersion(tx, actor, id, result);
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'cash_register_submitted',
      entityType: 'cash_register',
      entityId: id,
      meta: {
        registerBalance: result.registerBalance.toString(),
        documentsTotal: result.documentsTotal.toString(),
      },
    });

    return {
      id,
      status: CashRegisterStatus.submitted,
      submittedAt: now.toISOString(),
      message: 'صندوق با موفقیت بسته و برای حسابدار ارسال شد.',
    };
  }

  /**
   * ذخیرهٔ عکس کامل دادهٔ صندوق در لحظهٔ ارسال (بند ۳.۲ پرامپت).
   *
   * بدون این، حسابدار نمی‌توانست نسخهٔ ردشده و نسخهٔ اصلاح‌شده را واقعاً
   * مقایسه کند — تاریخچهٔ وضعیت به‌تنهایی فقط می‌گوید «رد شد»، نه اینکه
   * چه چیزی عوض شد.
   */
  private async saveVersion(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    actor: RequestUser,
    id: string,
    result: { registerBalance: bigint; documentsTotal: bigint; difference: bigint },
  ) {
    const transactions = await tx.transaction.findMany({
      where: { cashRegisterId: id },
      select: {
        type: true,
        amount: true,
        description: true,
        terminalId: true,
        sortOrder: true,
      },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });

    const lastVersion = await tx.cashRegisterVersion.findFirst({
      where: { cashRegisterId: id },
      select: { versionNumber: true },
      orderBy: { versionNumber: 'desc' },
    });

    await tx.cashRegisterVersion.create({
      data: {
        tenantId: actor.tenantId,
        cashRegisterId: id,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        createdById: actor.id,
        payload: {
          // مبالغ به رشته تبدیل می‌شوند چون JSON از BigInt پشتیبانی
          // نمی‌کند و دقت عدد نباید از دست برود.
          registerBalance: result.registerBalance.toString(),
          documentsTotal: result.documentsTotal.toString(),
          difference: result.difference.toString(),
          transactions: transactions.map((t) => ({
            type: t.type,
            amount: t.amount.toString(),
            description: t.description,
            terminalId: t.terminalId,
            sortOrder: t.sortOrder,
          })),
        },
      },
    });
  }

  private async loadOwned(actor: RequestUser, id: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: { id: true, cashierId: true, status: true },
    });

    if (!register) throw new ForbiddenException('صندوق یافت نشد.');

    if (actor.role !== UserRole.cashier || register.cashierId !== actor.id) {
      throw new ForbiddenException(
        'تنها صندوقدارِ صاحب این صندوق می‌تواند آن را ببندد.',
      );
    }

    return register;
  }
}
