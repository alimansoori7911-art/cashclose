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
}
