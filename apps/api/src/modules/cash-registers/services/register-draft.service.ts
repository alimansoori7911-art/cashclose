import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestUser } from '../../../common/tenant/request-user';
import { assertEditable } from '../cash-register.rules';
import type { SaveDraftDto } from '../dto/save-draft.dto';
import { RegisterCalculationService } from './register-calculation.service';

/** ذخیرهٔ پیش‌نویس صندوق. */
@Injectable()
export class RegisterDraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculation: RegisterCalculationService,
  ) {}

  /**
   * ذخیرهٔ پیش‌نویس.
   *
   * تراکنش‌ها به‌صورت «جایگزینی کامل» ذخیره می‌شوند: همه حذف و دوباره
   * درج می‌شوند. این ساده‌تر و مطمئن‌تر از تطبیق تک‌تک ردیف‌هاست، و چون
   * در یک تراکنش دیتابیس انجام می‌شود، قطع وسط کار داده را خراب
   * نمی‌گذارد (بند ۱۲.۱ سند).
   *
   * پیش‌نویس هیچ محدودیتی ندارد: فیلد ناقص، مبلغ صفر و نبود عکس همه
   * مجازند (بند ۱۱.۱ قاعدهٔ ۴). فقط بستن صندوق تابع قواعد است.
   */
  async saveDraft(actor: RequestUser, id: string, dto: SaveDraftDto) {
    const register = await this.loadEditable(actor, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { cashRegisterId: id } });

      if (dto.transactions.length > 0) {
        await tx.transaction.createMany({
          data: dto.transactions.map((t, index) => ({
            tenantId: register.tenantId,
            cashRegisterId: id,
            type: t.type,
            amount: BigInt(t.amount),
            description: t.description ?? null,
            terminalId: t.terminalId ?? null,
            sortOrder: t.sortOrder ?? index,
          })),
        });
      }

      if (dto.finalNotes !== undefined) {
        await tx.cashRegister.update({
          where: { id },
          data: { finalNotes: dto.finalNotes },
        });
      }
    });

    const result = await this.calculation.recalculateAndSave(id);

    return {
      id,
      status: register.status,
      savedAt: new Date().toISOString(),
      registerBalance: result.registerBalance,
      documentsTotal: result.documentsTotal,
      difference: result.difference,
      cashStatus: result.status,
      canClose: result.canClose,
    };
  }

  /**
   * بارگذاری صندوق با بررسی مالکیت و قابلیت ویرایش.
   *
   * فقط صندوقدارِ صاحب صندوق می‌تواند ویرایش کند — مدیر و حسابدار
   * حتی اگر دسترسی خواندن دارند، حق تغییر ندارند (بخش ۳ سند).
   */
  private async loadEditable(actor: RequestUser, id: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, tenantId: actor.tenantId },
      select: { id: true, tenantId: true, cashierId: true, status: true },
    });

    if (!register) {
      throw new ForbiddenException('صندوق یافت نشد.');
    }

    if (actor.role !== UserRole.cashier || register.cashierId !== actor.id) {
      throw new ForbiddenException(
        'تنها صندوقدارِ صاحب این صندوق می‌تواند آن را ویرایش کند.',
      );
    }

    assertEditable(register.status);
    return register;
  }
}
