import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeMeta } from './sanitize-meta';

/**
 * محتوای `meta` — شیئی ساده و قابل سریال‌سازی.
 *
 * `undefined` هم پذیرفته می‌شود چون DTOهای ویرایش، فیلدهای پرنشده را
 * `undefined` می‌گذارند؛ پیش از ذخیره حذفشان می‌کنیم.
 */
export type AuditMeta = Record<string, unknown>;

export interface AuditEntry {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  meta?: AuditMeta;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * ثبت ردِ ممیزی عملیات حساس (بند ۱۵.۱ سند).
 *
 * تصمیم مهم: شکست در ثبت لاگ هرگز عملیات اصلی را نمی‌شکند. اگر نوشتن
 * لاگ خطا بدهد، فقط هشدار ثبت می‌شود — چون از کار افتادن «ورود کاربر»
 * به‌خاطر یک لاگ ناموفق، آسیبش بیشتر از نبود آن رکورد لاگ است.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId ?? null,
          userId: entry.userId ?? null,
          action: entry.action,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          meta: sanitizeMeta(entry.meta),
          ipAddress: entry.ipAddress?.slice(0, 64) ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `ثبت لاگ ممیزی «${entry.action}» ناموفق بود: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
