import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * تبدیل `BigInt` به عدد در پاسخ‌های JSON.
 *
 * مبالغ در دیتابیس `BigInt` هستند ولی `JSON.stringify` روی BigInt خطا
 * می‌دهد. به‌جای وصله‌کردن سراسری `BigInt.prototype.toJSON` (که رفتار
 * زبان را برای کل فرایند عوض می‌کند)، تبدیل را فقط در مرز خروجی HTTP
 * انجام می‌دهیم.
 *
 * مبالغ ریالی در عمل بسیار کمتر از `Number.MAX_SAFE_INTEGER` هستند، ولی
 * برای اطمینان، مقادیر خارج از محدودهٔ امن به‌صورت رشته برگردانده
 * می‌شوند تا دقت از دست نرود.
 */
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => serializeBigInt(data)));
  }
}

export function serializeBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) &&
      value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  // `Date` و مقادیر غیرساده دست‌نخورده می‌مانند تا سریال‌سازی پیش‌فرض
  // (مثلاً ISO برای تاریخ) حفظ شود.
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        serializeBigInt(item),
      ]),
    );
  }

  return value;
}
