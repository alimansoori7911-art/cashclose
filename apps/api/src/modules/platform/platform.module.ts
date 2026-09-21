import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PasswordService } from '../auth/services/password.service';
import { PlatformController } from './platform.controller';
import { PlatformJwtStrategy } from './platform-jwt.strategy';
import { PlatformAuthService } from './services/platform-auth.service';
import { OwnerRecoveryService } from './services/owner-recovery.service';
import { ProvisioningService } from './services/provisioning.service';
import { TenantAdminService } from './services/tenant-admin.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // کوتاه‌تر از توکن کاربران: این حساب فقط گاهی برای ساخت مشتری
        // تازه استفاده می‌شود، پس نشست طولانی لازم ندارد.
        signOptions: { expiresIn: '2h' },
      }),
    }),
  ],
  controllers: [PlatformController],
  providers: [
    PlatformJwtStrategy,
    PlatformAuthService,
    ProvisioningService,
    OwnerRecoveryService,
    TenantAdminService,
    PasswordService,
  ],
})
export class PlatformModule {}
