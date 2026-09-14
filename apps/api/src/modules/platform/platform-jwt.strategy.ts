import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../common/prisma/prisma.service';

/** مدیر سامانه پس از احراز هویت. */
export interface RequestAdmin {
  id: string;
  username: string;
  fullName: string;
}

interface AdminJwtPayload {
  sub: string;
  /**
   * نشانگر نوع توکن.
   *
   * بدون این، توکن یک کاربر عادی و توکن مدیر سامانه از هم قابل تشخیص
   * نبودند و شناسهٔ یکسان می‌توانست در هر دو مسیر پذیرفته شود.
   */
  kind: 'platform-admin';
}

/**
 * اعتبارسنجی توکن مدیر سامانه.
 *
 * استراتژی جداست، نه شاخه‌ای داخل استراتژی کاربران: مدیر سامانه در جدول
 * `users` وجود ندارد و قاطی‌کردن این دو مسیر یعنی هر اشتباه کوچک در
 * شرط‌ها، مرز جداسازی داده را سست می‌کند.
 *
 * مثل کاربران، در **هر درخواست** از دیتابیس خوانده می‌شود تا غیرفعال‌شدن
 * حساب بلافاصله اثر کند.
 */
@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(
  Strategy,
  'platform-jwt',
) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<RequestAdmin> {
    if (payload.kind !== 'platform-admin') {
      throw new UnauthorizedException('توکن برای این بخش معتبر نیست.');
    }

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, fullName: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('دسترسی مدیر سامانه معتبر نیست.');
    }

    return {
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
    };
  }
}
