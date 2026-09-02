import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

import { ERROR_CODES, ERROR_MESSAGES } from './error-codes';

/**
 * قالب یکسان پاسخ خطا در کل API (بند ۹.۸ سند).
 *
 * دو هدف:
 *  ۱. کاربر همیشه پیام فارسی و قابل‌فهم بگیرد، نه متن پیش‌فرض انگلیسی.
 *  ۲. جزئیات داخلی (پیام خطای دیتابیس، stack trace) هرگز به بیرون درز
 *     نکند — فقط در لاگ سرور ثبت می‌شود.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const { status, message, code } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      error: code,
      message,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
    code: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      // خطاهای اعتبارسنجی ValidationPipe آرایه‌ای از پیام‌ها دارند.
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? ((payload as { message: string | string[] }).message ??
            exception.message)
          : exception.message;

      return {
        status,
        message,
        code: ERROR_CODES[status] ?? 'ERROR',
      };
    }

    // دیتابیس در دسترس نیست — رایج‌ترین خطای عملیاتی.
    if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'ارتباط با پایگاه داده برقرار نیست. لطفاً کمی بعد دوباره تلاش کنید.',
        code: 'SERVICE_UNAVAILABLE',
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES.INTERNAL,
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  private resolvePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'این مقدار قبلاً ثبت شده است.',
          code: 'CONFLICT',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'مورد درخواستی یافت نشد.',
          code: 'NOT_FOUND',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'ارجاع به رکوردی که وجود ندارد.',
          code: 'VALIDATION_ERROR',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: ERROR_MESSAGES.INTERNAL,
          code: 'INTERNAL_SERVER_ERROR',
        };
    }
  }
}
