import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { requestContext, resolveRequestId } from './request-context';

/** هدر استاندارد ردیابی درخواست بین سرویس‌ها. */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * ساخت context برای هر درخواست.
 *
 * Middleware است نه Interceptor: باید **پیش از** Guardها اجرا شود تا
 * حتی درخواستی که در احراز هویت رد می‌شود هم شناسه داشته باشد.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);

    // شناسه به پاسخ هم برمی‌گردد تا کاربر بتواند هنگام گزارش خطا آن را
    // بدهد و همان درخواست در لاگ پیدا شود.
    res.setHeader(REQUEST_ID_HEADER, requestId);

    requestContext.run({ requestId }, () => next());
  }
}
