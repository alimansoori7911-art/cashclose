import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * اتصال به دیتابیس.
 *
 * نکتهٔ سریال‌سازی: مبالغ در دیتابیس `BigInt` هستند و `JSON.stringify`
 * به‌صورت پیش‌فرض روی BigInt خطا می‌دهد. به‌جای وصلهٔ سراسری روی
 * `BigInt.prototype`، تبدیل در لایهٔ سریال‌سازی پاسخ انجام می‌شود
 * (`BigIntInterceptor`) تا رفتار سراسری زبان دست‌کاری نشود.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  /**
   * قطعی دیتابیس هنگام استارت، سرویس را از کار نمی‌اندازد.
   *
   * دلیل: اگر فرایند بالا نیاید، `/health` هم پاسخ نمی‌دهد و تشخیص
   * اینکه «سرویس خراب است» یا «دیتابیس قطع است» ممکن نیست. با این
   * رفتار، سرویس بالا می‌آید، `/health` وضعیت `degraded` گزارش می‌کند و
   * Prisma در اولین کوئری موفق دوباره وصل می‌شود.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('اتصال به دیتابیس برقرار شد.');
    } catch (error) {
      this.logger.error(
        'اتصال اولیه به دیتابیس برقرار نشد؛ سرویس در وضعیت degraded بالا می‌آید. ' +
          'مقدار DATABASE_URL و در دسترس بودن PostgreSQL را بررسی کنید.',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
