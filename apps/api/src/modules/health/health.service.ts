import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface HealthReport {
  status: 'ok' | 'degraded';
  version: string;
  database: 'up' | 'down';
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * سلامت سرویس.
   *
   * قطعی دیتابیس باعث خطای ۵۰۰ نمی‌شود؛ وضعیت `degraded` برمی‌گردد تا
   * ابزارهای پایش بتوانند بین «سرویس بالا نیامده» و «دیتابیس قطع است»
   * تفاوت بگذارند.
   */
  async check(): Promise<HealthReport> {
    let database: 'up' | 'down' = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch (error) {
      this.logger.warn(
        `بررسی سلامت دیتابیس ناموفق بود: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      version: '1.0.0',
      database,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * آیا این نام میزبان متعلق به مجموعه‌ای فعال است؟
   *
   * Caddy پیش از صدور گواهی HTTPS می‌پرسد. اگر همیشه «بله» می‌گفتیم،
   * هر کسی می‌توانست دامنهٔ خودش را به این سرور اشاره دهد و ما را وادار
   * به گرفتن گواهی کند تا به سقف نرخ Let's Encrypt برسیم.
   */
  async isKnownHost(host: string | undefined): Promise<boolean> {
    if (!host) return false;

    const hostname = host.split(':')[0]?.toLowerCase().trim();
    if (!hostname) return false;

    const parts = hostname.split('.');

    // دامنهٔ اصلی (بدون زیردامنه) همیشه مجاز است: صفحهٔ ورود و پنل
    // مدیر سامانه روی آن می‌نشینند.
    if (parts.length < 3) return true;

    const slug = parts[0];
    if (!slug) return false;

    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, status: 'active' },
      select: { id: true },
    });

    return Boolean(tenant);
  }
}
