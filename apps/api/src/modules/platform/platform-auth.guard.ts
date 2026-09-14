import {
  createParamDecorator,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { RequestAdmin } from './platform-jwt.strategy';

/**
 * محافظ مسیرهای مدیر سامانه.
 *
 * از استراتژی `platform-jwt` استفاده می‌کند، نه `jwt` عمومی — پس توکن
 * یک کاربر عادی (حتی مالک) اینجا پذیرفته نمی‌شود.
 */
@Injectable()
export class PlatformAuthGuard extends AuthGuard('platform-jwt') {}

/** مدیر سامانهٔ درخواست جاری. */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestAdmin => {
    return context.switchToHttp().getRequest<{ user: RequestAdmin }>().user;
  },
);
