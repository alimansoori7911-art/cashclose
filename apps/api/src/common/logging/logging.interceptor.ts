import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

import type { RequestUser } from '../tenant/request-user';
import { requestContext } from './request-context';

/**
 * درخواست‌های پرتکرار و کم‌ارزش که لاگشان فقط نویز است.
 *
 * مسیرهای سلامت را ارکستراتور هر چند ثانیه صدا می‌زند؛ لاگ‌کردنشان
 * فایل لاگ را پر می‌کند و درخواست‌های واقعی را دفن می‌کند.
 */
const QUIET_PATHS = [
  '/api/v1/health',
  '/api/v1/health/live',
  '/api/v1/health/ready',
  '/api/v1/notifications/unread-count',
];

/** کندتر از این (میلی‌ثانیه) یعنی جای بررسی دارد. */
const SLOW_REQUEST_MS = 1_000;

/**
 * لاگ یک‌خطی برای هر درخواست (بند ۱۲ سند).
 *
 * عمداً بدنهٔ درخواست لاگ نمی‌شود: بدنه‌ها حاوی رمز، توکن و مبالغ
 * مشتری‌اند و نوشتنشان در فایل لاگ یعنی نشت داده. متد، مسیر، وضعیت و
 * زمان برای عیب‌یابی کافی است.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: RequestUser }>();

    if (QUIET_PATHS.includes(request.path)) {
      return next.handle();
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.write(context, request, startedAt),
        // خطاها را فیلتر استثنا لاگ می‌کند؛ اینجا فقط مدت‌زمان ثبت
        // می‌شود تا درخواست کندِ ناموفق هم دیده شود.
        error: () => this.write(context, request, startedAt, true),
      }),
    );
  }

  private write(
    context: ExecutionContext,
    request: Request & { user?: RequestUser },
    startedAt: number,
    failed = false,
  ): void {
    const duration = Date.now() - startedAt;
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user;

    // شناسهٔ کاربر پس از Guard در دسترس است و به context اضافه می‌شود
    // تا لاگ‌های بعدی همین درخواست هم آن را داشته باشند.
    if (user) requestContext.setUser(user.id, user.tenantId);

    const line = [
      `[${requestContext.id()}]`,
      request.method,
      request.originalUrl,
      failed ? '→ خطا' : `→ ${response.statusCode}`,
      `${duration}ms`,
      user ? `کاربر=${user.id}` : 'ناشناس',
    ].join(' ');

    if (duration >= SLOW_REQUEST_MS) {
      this.logger.warn(`${line} — کندتر از حد انتظار`);
    } else {
      this.logger.log(line);
    }
  }
}
