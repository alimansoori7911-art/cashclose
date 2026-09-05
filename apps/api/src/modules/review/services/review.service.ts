import { Injectable, NotFoundException } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';

import { formatJalali } from '@cashclose/shared';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestUser } from '../../../common/tenant/request-user';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { assertCanApprove, assertCanReject } from '../review.rules';
import {
  APPROVE,
  REJECT,
  timestamps,
  type TransitionSpec,
} from './status-transition';

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

    return this.transition(actor, register, APPROVE, {
      comment: comment ?? null,
      notice: `صندوق ${formatJalali(toIso(register.businessDate))} تأیید شد.`,
    });
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

    const trimmed = comment.trim();
    const wasApproved = register.status === CashRegisterStatus.approved;

    return this.transition(actor, register, REJECT, {
      comment: trimmed,
      notice: `صندوق ${formatJalali(
        toIso(register.businessDate),
      )} رد شد: ${trimmed}`,
      auditMeta: { wasApproved },
    });
  }

  /** بدنهٔ مشترک هر دو گذار. */
  private async transition(
    actor: RequestUser,
    register: { id: string; cashierId: string },
    spec: TransitionSpec,
    detail: {
      comment: string | null;
      notice: string;
      auditMeta?: Record<string, unknown>;
    },
  ) {
    const now = new Date();
    const { id } = register;

    // تغییر وضعیت و ثبت تاریخچه اتمیک‌اند: تاریخچهٔ ناقص یعنی نبود
    // ردپای حسابرسی برای تصمیمی که گرفته شده.
    await this.prisma.$transaction([
      this.prisma.cashRegister.update({
        where: { id },
        data: { status: spec.status, ...timestamps(spec, now) },
      }),
      this.prisma.cashRegisterHistory.create({
        data: {
          tenantId: actor.tenantId,
          cashRegisterId: id,
          status: spec.status,
          comment: detail.comment,
          createdById: actor.id,
        },
      }),
    ]);

    await this.notifications.notify({
      tenantId: actor.tenantId,
      userId: register.cashierId,
      type: spec.notificationType,
      message: detail.notice,
      cashRegisterId: id,
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: spec.auditAction,
      entityType: 'cash_register',
      entityId: id,
      meta: { comment: detail.comment, ...detail.auditMeta },
    });

    return {
      id,
      status: spec.status,
      [spec.timestampField]: now.toISOString(),
      message: spec.successMessage,
    };
  }

  private async load(tenantId: string, id: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, cashierId: true, businessDate: true },
    });

    if (!register) throw new NotFoundException('صندوق یافت نشد.');
    return register;
  }
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
