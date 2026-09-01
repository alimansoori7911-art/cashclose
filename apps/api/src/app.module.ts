import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // پیکربندی در زمان بالا آمدن اعتبارسنجی می‌شود تا خطای تنظیمات
      // به‌جای زمان اجرا، همان لحظهٔ استارت مشخص شود.
      validate: validateEnv,
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL_SECONDS', 60) * 1000,
          limit: config.get<number>('RATE_LIMIT_MAX', 120),
        },
      ],
    }),

    PrismaModule,
    HealthModule,
  ],
  providers: [
    // محدودیت نرخ درخواست به‌صورت سراسری (بند ۷ فازبندی).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // مبالغ BigInt پیش از سریال‌سازی JSON تبدیل می‌شوند.
    { provide: APP_INTERCEPTOR, useClass: BigIntInterceptor },
  ],
})
export class AppModule {}
