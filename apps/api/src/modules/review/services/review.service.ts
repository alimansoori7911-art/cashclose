import { Injectable, NotFoundException } from '@nestjs/common';
import { CashRegisterStatus, NotificationType } from '@prisma/client';

import { formatJalali } from '@cashclose/shared';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestUser } from '../../../common/tenant/request-user';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { assertCanApprove, assertCanReject } from '../review.rules';

/** تأیید و رد صندوق توسط حسابدار. */
@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async approve(actor: RequestUser, id: string, comment?: string) {
    const register = await this.load(actor.tenantId, id);
    assertCanApprove(register.status);

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.cashRegister.update({
        where: { id },
        data: {
          status: CashRegisterStatus.approved,
          approvedAt: now,
          rejectedAt: null,
        },
      }),
      this.prisma.cashRegisterHistory.create({
        data: {
          tenantId: actor.tenantId,
          cashRegisterId: id,
          status: CashRegisterStatus.approved,
          comment: comment ?? null,
          createdById: actor.id,
        },
      }),
    ]);

    await this.notifications.notify({
      tenantId: actor.tenantId,
      userId: register.cashierId,
      type: NotificationType.cash_register_approved,
      message: `صندوق ${formatJalali(this.toIso(register.businessDate))} تأیید شد.`,
      cashRegisterId: id,
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'cash_register_approved',
      entityType: 'cash_register',
      entityId: id,
      meta: { comment },
    });

    return {
      id,
      status: CashRegisterStatus.approved,
      approvedAt: now.toISOString(),
      message: 'صندوق تأیید شد.',
    };
  }

  /**
   * رد صندوق و بازگرداندن آن به صندوقدار.
   *
   * صندوق تأییدشده هم قابل رد است (بند ۱۱.۲ قاعدهٔ ۲): اگر بعداً خطایی
   * کشف شود، باید بتوان آن را برگرداند.
   */
  async reject(actor: RequestUser, id: string, comment: string) {
    const register = await this.load(actor.tenantId, id);
    assertCanReject(register.status, comment);

    const now = new Date();
    const wasApproved = register.status === CashRegisterStatus.approved;

    await this.prisma.$transaction([
      this.prisma.cashRegister.update({
        where: { id },
        data: {
          status: CashRegisterStatus.rejected,
          rejectedAt: now,
          approvedAt: null,
        },
      }),
      this.prisma.cashRegisterHistory.create({
        data: {
          tenantId: actor.tenantId,
          cashRegisterId: id,
          status: CashRegisterStatus.rejected,
          comment: comment.trim(),
          createdById: actor.id,
        },
      }),
    ]);

    await this.notifications.notify({
      tenantId: actor.tenantId,
      userId: register.cashierId,
      type: NotificationType.cash_register_rejected,
      message: `صندوق ${formatJalali(
        this.toIso(register.businessDate),
      )} رد شد: ${comment.trim()}`,
      cashRegisterId: id,
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'cash_register_rejected',
      entityType: 'cash_register',
      entityId: id,
      meta: { comment: comment.trim(), wasApproved },
    });

    return {
      id,
      status: CashRegisterStatus.rejected,
      rejectedAt: now.toISOString(),
      message: 'صندوق رد و برای اصلاح به صندوقدار بازگردانده شد.',
    };
  }

  private async load(tenantId: string, id: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        status: true,
        cashierId: true,
        businessDate: true,
      },
    });

    if (!register) throw new NotFoundException('صندوق یافت نشد.');
    return register;
  }

  private toIso(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
