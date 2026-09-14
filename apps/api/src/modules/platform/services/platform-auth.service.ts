import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { PasswordService } from '../../auth/services/password.service';

/**
 * ورود مدیر سامانه.
 *
 * همان محافظت‌های ورود کاربران: پیام خطای یکسان برای «کاربر نیست» و
 * «رمز اشتباه»، و راستی‌آزمایی ساختگی وقتی حساب وجود ندارد تا اختلاف
 * زمان پاسخ، وجود یا نبود حساب را لو ندهد.
 */
@Injectable()
export class PlatformAuthService {
  private dummyHash = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
  ) {}

  async login(username: string, password: string) {
    if (!this.dummyHash) {
      this.dummyHash = await this.passwords.hash('placeholder-not-a-password');
    }

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        passwordHash: true,
        isActive: true,
      },
    });

    const valid = admin
      ? await this.passwords.verify(admin.passwordHash, password)
      : await this.passwords.verify(this.dummyHash, password);

    if (!admin || !valid || !admin.isActive) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور نادرست است.');
    }

    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: await this.jwt.signAsync({
        sub: admin.id,
        kind: 'platform-admin',
      }),
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
      },
    };
  }
}
