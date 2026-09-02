import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../tenant/request-user';

/**
 * Guard مجوز نقش — پس از احراز هویت اجرا می‌شود.
 *
 * مسیری که `@Roles()` ندارد برای همهٔ کاربرانِ احرازهویت‌شده باز است؛
 * محدودیت نقش باید صریح اعلام شود.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    // اگر Guard احراز هویت اجرا نشده باشد، اینجا کاربر وجود ندارد؛
    // بستن مسیر امن‌ترین رفتار است.
    if (!user) {
      throw new ForbiddenException('این عملیات برای نقش شما مجاز نیست.');
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException('این عملیات برای نقش شما مجاز نیست.');
    }

    return true;
  }
}
