import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type {
  AuthenticatedRequest,
  RequestUser,
} from '../tenant/request-user';

/**
 * تزریق کاربر لاگین‌شده به پارامتر متد کنترلر.
 *
 * استفاده: `findAll(@CurrentUser() user: RequestUser)`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

/**
 * تزریق مستقیم شناسهٔ مستأجر.
 *
 * چون تقریباً هر کوئری به آن نیاز دارد، این میان‌بر باعث می‌شود کد
 * سرویس‌ها تمیزتر بماند.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user.tenantId;
  },
);
