import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CashRegistersModule } from './modules/cash-registers/cash-registers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReviewModule } from './modules/review/review.module';
import { StorageModule } from './common/storage/storage.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';
import { PosTerminalsModule } from './modules/pos-terminals/pos-terminals.module';
import { StoresModule } from './modules/stores/stores.module';
import { UsersModule } from './modules/users/users.module';
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
    StorageModule,
    AuditModule,
    AuthModule,
    UsersModule,
    StoresModule,
    BranchesModule,
    PosTerminalsModule,
    CashRegistersModule,
    ReviewModule,
    ReportsModule,
    NotificationsModule,
    UploadsModule,
    AuditLogsModule,
    HealthModule,
  ],
  providers: [
    // ترتیب این Guardها مهم است و به همین ترتیب اجرا می‌شوند:
    //   ۱. محدودیت نرخ درخواست (بند ۷ فازبندی)
    //   ۲. احراز هویت — پیش‌فرض «بسته»؛ استثنا فقط با @Public()
    //   ۳. مجوز نقش — فقط روی مسیرهایی که @Roles() دارند
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // مبالغ BigInt پیش از سریال‌سازی JSON تبدیل می‌شوند.
    { provide: APP_INTERCEPTOR, useClass: BigIntInterceptor },
  ],
})
export class AppModule {}
