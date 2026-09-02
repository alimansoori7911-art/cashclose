import { HttpStatus } from '@nestjs/common';

/** کدهای خطای استاندارد سامانه — بند ۹.۸ سند. */
export const ERROR_CODES: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

export const ERROR_MESSAGES = {
  /** پیام عمومی خطای سرور — جزئیات داخلی هرگز به کاربر نشان داده نمی‌شود. */
  INTERNAL: 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.',
} as const;
