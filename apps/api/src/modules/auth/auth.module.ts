import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { LoginThrottleService } from './services/login-throttle.service';
import { PasswordResetService } from './services/password-reset.service';
import { PasswordService } from './services/password.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // قالب این مقدار در env.validation اعتبارسنجی شده است؛
          // نوع دقیق `StringValue` کتابخانهٔ ms در امضای عمومی صادر
          // نشده، پس همان‌جا مهار می‌شود نه اینجا.
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '12h',
          ) as `${number}h`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetService,
    PasswordService,
    LoginThrottleService,
    JwtStrategy,
  ],
  exports: [PasswordService],
})
export class AuthModule {}
