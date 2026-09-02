import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type {
  JwtPayload,
  RequestUser,
} from '../../../common/tenant/request-user';

/**
 * اعتبارسنجی توکن دسترسی.
 *
 * تصمیم مهم: کاربر در **هر درخواست** از دیتابیس خوانده می‌شود، نه اینکه
 * صرفاً به محتوای توکن اعتماد شود. هزینه‌اش یک کوئری با ایندکس اولیه است،
 * ولی در عوض غیرفعال‌کردن کاربر یا تغییر نقش او بلافاصله اثر می‌کند و
 * لازم نیست تا انقضای ۱۲ ساعتهٔ توکن صبر کنیم — که برای سامانه‌ای مالی
 * با اطلاعات چند کسب‌وکار مختلف، الزامی است.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        username: true,
        role: true,
        branchId: true,
        status: true,
        tenant: { select: { status: true } },
      },
    });

    if (!user || user.status !== UserStatus.active) {
      throw new UnauthorizedException('حساب کاربری فعال نیست.');
    }

    // مستأجر تعلیق‌شده یعنی همهٔ کاربرانش بلافاصله دسترسی ندارند.
    if (user.tenant.status !== 'active') {
      throw new UnauthorizedException('دسترسی این مجموعه غیرفعال شده است.');
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
    };
  }
}
