import { BadRequestException, ConflictException } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';

/**
 * قواعد بازبینی حسابدار (بخش ۱۱.۲ سند).
 *
 * جدا از دسترسی به دیتابیس نگه داشته شده تا مستقل تست شوند.
 */

/**
 * تأیید فقط روی صندوق ارسال‌شده.
 *
 * صندوق draft هنوز کار صندوقدار است و approved قبلاً تأیید شده — هیچ‌کدام
 * دوباره تأیید نمی‌شوند.
 */
export function assertCanApprove(status: CashRegisterStatus): void {
  if (status === CashRegisterStatus.submitted) return;

  if (status === CashRegisterStatus.draft) {
    throw new ConflictException(
      'این صندوق هنوز توسط صندوقدار بسته نشده است.',
    );
  }

  if (status === CashRegisterStatus.approved) {
    throw new ConflictException('این صندوق قبلاً تأیید شده است.');
  }

  throw new ConflictException(
    'صندوق ردشده تا اصلاح و ارسال دوباره قابل تأیید نیست.',
  );
}

/**
 * رد صندوق.
 *
 * برخلاف تأیید، صندوقِ **تأییدشده** هم قابل رد است — بند ۱۱.۲ قاعدهٔ ۲
 * صریحاً این را خواسته تا اگر بعداً خطایی کشف شد، بتوان صندوق را
 * برگرداند.
 */
export function assertCanReject(
  status: CashRegisterStatus,
  comment: string | undefined,
): void {
  // بند ۱۱.۲ قاعدهٔ ۴: توضیح در رد اجباری است.
  if (!comment || comment.trim().length === 0) {
    throw new BadRequestException('برای رد صندوق، ثبت علت الزامی است.');
  }

  if (
    status === CashRegisterStatus.submitted ||
    status === CashRegisterStatus.approved
  ) {
    return;
  }

  if (status === CashRegisterStatus.draft) {
    throw new ConflictException(
      'این صندوق هنوز توسط صندوقدار بسته نشده است.',
    );
  }

  throw new ConflictException('این صندوق قبلاً رد شده است.');
}
