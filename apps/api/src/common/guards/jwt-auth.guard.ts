import {
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';

/**
 * Guard احراز هویت — به‌صورت سراسری روی همهٔ مسیرها اعمال می‌شود.
 *
 * پیش‌فرض «بسته» است: هر مسیری توکن معتبر می‌خواهد مگر اینکه صریحاً با
 * `@Public()` استثنا شده باشد. این وارونگی عمدی است — اگر پیش‌فرض باز
 * بود، فراموش‌کردن یک دکوراتور روی یک مسیر جدید به نشت داده منجر می‌شد.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  /**
   * پیام فارسی به‌جای «Unauthorized» پیش‌فرض Passport.
   *
   * پیام برای همهٔ حالت‌ها (نبود توکن، انقضا، امضای نامعتبر) یکسان است
   * تا اطلاعاتی دربارهٔ دلیل رد شدن به مهاجم داده نشود.
   */
  override handleRequest<TUser>(
    err: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException(
            'برای دسترسی به این بخش باید وارد سامانه شوید.',
          );
    }
    return user;
  }
}
