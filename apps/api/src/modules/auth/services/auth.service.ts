import {
  Injectable,
  UnauthorizedException,
  type OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type {
  JwtPayload,
  RequestUser,
} from '../../../common/tenant/request-user';
import { AuditService } from '../../audit/audit.service';
import type { LoginDto } from '../dto/login.dto';
import { LoginThrottleService } from './login-throttle.service';
import { PasswordService } from './password.service';

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: RequestUser & { fullName: string };
}

@Injectable()
export class AuthService implements OnModuleInit {
  /** هش ساختگی برای یکسان‌سازی زمان پاسخ وقتی کاربر وجود ندارد. */
  private dummyHash = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
    private readonly throttle: LoginThrottleService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit(): Promise<void> {
    // یک‌بار ساخته می‌شود تا در هر لاگینِ ناموفق هزینهٔ هش دوباره تکرار نشود.
    this.dummyHash = await this.passwords.hash('dummy-password-for-timing');
  }

  /**
   * ورود کاربر.
   *
   * دو نکتهٔ امنیتی:
   *  ۱. پیام خطای «کاربر یافت نشد» و «رمز اشتباه» یکسان است تا مهاجم
   *     نتواند فهرست نام‌های کاربری معتبر را استخراج کند.
   *  ۲. وقتی کاربر وجود ندارد هم یک راستی‌آزمایی ساختگی انجام می‌شود تا
   *     اختلاف زمان پاسخ، وجود یا نبود کاربر را لو ندهد.
   */
  async login(dto: LoginDto, ip?: string): Promise<LoginResult> {
    const throttleKey = `${dto.username}:${ip ?? 'unknown'}`;
    const lockSeconds = this.throttle.getLockRemainingSeconds(throttleKey);

    if (lockSeconds !== null) {
      throw new UnauthorizedException(
        `به دلیل تلاش‌های ناموفق، ورود موقتاً مسدود است. ${Math.ceil(
          lockSeconds / 60,
        )} دقیقهٔ دیگر تلاش کنید.`,
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { username: dto.username },
      select: {
        id: true,
        tenantId: true,
        username: true,
        fullName: true,
        role: true,
        branchId: true,
        status: true,
        passwordHash: true,
        tenant: { select: { status: true } },
      },
    });

    const passwordValid = user
      ? await this.passwords.verify(user.passwordHash, dto.password)
      : await this.passwords.verify(this.dummyHash, dto.password);

    const active =
      user?.status === UserStatus.active && user.tenant.status === 'active';

    if (!user || !passwordValid || !active) {
      this.throttle.registerFailure(throttleKey);
      await this.audit.record({
        tenantId: user?.tenantId ?? null,
        userId: user?.id ?? null,
        action: 'login_failed',
        meta: { username: dto.username },
        ipAddress: ip,
      });
      throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است.');
    }

    this.throttle.clear(throttleKey);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.record({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'login_success',
      ipAddress: ip,
    });

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: '12h',
      user: {
        id: user.id,
        tenantId: user.tenantId,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }
}
