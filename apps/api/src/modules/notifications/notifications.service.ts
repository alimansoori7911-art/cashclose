import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  paginate,
  type PaginatedResult,
  type PaginationDto,
} from '../../common/pagination/pagination.dto';
import type { RequestUser } from '../../common/tenant/request-user';

/**
 * اعلان‌های داخل‌برنامه‌ای (بند ۳.۴ پرامپت).
 *
 * فقط درون سامانه — بدون پیامک، ایمیل یا تلگرام، طبق بخش Out of Scope
 * سند.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ساخت اعلان.
   *
   * مثل لاگ ممیزی، شکست در ساخت اعلان نباید عملیات اصلی را بشکند: اگر
   * رد کردن صندوق به‌خاطر یک اعلان ناموفق کنسل شود، آسیبش بیشتر است.
   */
  async notify(input: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    message: string;
    cashRegisterId?: string;
  }): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          type: input.type,
          message: input.message,
          cashRegisterId: input.cashRegisterId ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `ساخت اعلان «${input.type}» ناموفق بود: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** فهرست اعلان‌های کاربر جاری. */
  async findMine(
    actor: RequestUser,
    pagination: PaginationDto,
    unreadOnly = false,
  ): Promise<PaginatedResult<unknown>> {
    const where = {
      userId: actor.id,
      tenantId: actor.tenantId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          message: true,
          isRead: true,
          cashRegisterId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(items, total, pagination);
  }

  /** شمار اعلان‌های خوانده‌نشده — برای نشان روی آیکون. */
  async countUnread(actor: RequestUser): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId: actor.id, tenantId: actor.tenantId, isRead: false },
    });

    return { count };
  }

  async markRead(actor: RequestUser, id: string) {
    // قید `userId` یعنی کاربر نمی‌تواند اعلان دیگری را خوانده علامت بزند.
    const result = await this.prisma.notification.updateMany({
      where: { id, userId: actor.id, tenantId: actor.tenantId },
      data: { isRead: true },
    });

    if (result.count === 0) throw new NotFoundException('اعلان یافت نشد.');
    return { message: 'اعلان خوانده شد.' };
  }

  async markAllRead(actor: RequestUser) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: actor.id, tenantId: actor.tenantId, isRead: false },
      data: { isRead: true },
    });

    return { message: `${result.count} اعلان خوانده شد.`, count: result.count };
  }
}
