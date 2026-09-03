import { BadRequestException, ConflictException } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';

import { addDaysIso, todayIso } from '@cashclose/shared';

/**
 * قواعد کسب‌وکاری صندوق روزانه (بخش ۱۱.۱ سند).
 *
 * جدا از دسترسی به دیتابیس نگه داشته شده تا مستقل و بدون نیاز به
 * دیتابیس تست شوند — این قواعد قلب سامانه‌اند و باید قطعی باشند.
 */

/** وضعیت‌هایی که «باز» محسوب می‌شوند و مانع ساخت صندوق جدیدند. */
export const OPEN_STATUSES: readonly CashRegisterStatus[] = [
  CashRegisterStatus.draft,
  CashRegisterStatus.submitted,
  CashRegisterStatus.rejected,
];

/** وضعیت‌هایی که صندوقدار در آن‌ها اجازهٔ ویرایش دارد. */
export const EDITABLE_STATUSES: readonly CashRegisterStatus[] = [
  CashRegisterStatus.draft,
  CashRegisterStatus.rejected,
];

export function isOpen(status: CashRegisterStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export function isEditable(status: CashRegisterStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

/**
 * تاریخ صندوق فقط امروز یا دیروز (بند ۱۱.۱ قاعدهٔ ۲).
 *
 * صندوق آینده بی‌معناست و صندوق قدیمی‌تر از دیروز یعنی چند روز فراموش
 * شده که باید با فلوی «دو روزه» یا دخالت مدیر حل شود، نه ساخت عادی.
 */
export function assertDateAllowed(businessDate: string): void {
  const today = todayIso();
  const yesterday = addDaysIso(today, -1);

  if (businessDate > today) {
    throw new BadRequestException(
      'ساخت صندوق برای تاریخ آینده مجاز نیست.',
    );
  }

  if (businessDate < yesterday) {
    throw new BadRequestException(
      'صندوق فقط برای امروز یا دیروز قابل ایجاد است. برای روزهای قدیمی‌تر با مدیر تماس بگیرید.',
    );
  }
}

/**
 * صندوق باز قبلی مانع ساخت صندوق جدید است (بند ۱۱.۱ قاعدهٔ ۱).
 *
 * استثنا: صندوقی که خودش برای همان تاریخ است — آن حالت «تکراری» است و
 * پیام متفاوتی می‌گیرد.
 */
export function assertNoBlockingRegister(
  openRegisters: { businessDate: Date; status: CashRegisterStatus }[],
  businessDate: string,
): void {
  const sameDate = openRegisters.find(
    (r) => toIso(r.businessDate) === businessDate,
  );

  if (sameDate) {
    throw new ConflictException(
      'برای این تاریخ قبلاً صندوقی ایجاد شده است.',
    );
  }

  if (openRegisters.length > 0) {
    const dates = openRegisters.map((r) => toIso(r.businessDate)).join('، ');
    throw new ConflictException(
      `تا زمانی که صندوق روزهای قبل بسته نشود، امکان ایجاد صندوق جدید نیست. صندوق باز: ${dates}`,
    );
  }
}

/** بستن صندوق فقط با اختلاف صفر (بند ۱۱.۱ قاعدهٔ ۳). */
export function assertCanClose(
  status: CashRegisterStatus,
  difference: bigint,
): void {
  if (!isEditable(status)) {
    throw new ConflictException(
      status === CashRegisterStatus.submitted
        ? 'این صندوق قبلاً بسته و برای حسابدار ارسال شده است.'
        : 'این صندوق تأیید شده و قابل تغییر نیست.',
    );
  }

  if (difference !== 0n) {
    throw new BadRequestException(
      'تا زمانی که اختلاف صندوق صفر نشود، بستن آن مجاز نیست.',
    );
  }
}

/** ویرایش فقط در حالت پیش‌نویس یا ردشده (بند ۱۱.۱ قاعدهٔ ۶). */
export function assertEditable(status: CashRegisterStatus): void {
  if (isEditable(status)) return;

  throw new ConflictException(
    status === CashRegisterStatus.submitted
      ? 'صندوق ارسال‌شده تا زمان بررسی حسابدار قابل ویرایش نیست.'
      : 'صندوق تأییدشده قابل ویرایش نیست.',
  );
}

/**
 * صندوق دوروزه: تاریخ پایان باید دقیقاً روز بعدِ تاریخ شروع باشد.
 *
 * فاصلهٔ بیشتر یعنی چند روز فراموش شده که خارج از این فلوست.
 */
export function assertValidTwoDayRange(
  businessDate: string,
  coversUntil: string,
): void {
  if (coversUntil <= businessDate) {
    throw new BadRequestException(
      'تاریخ پایان صندوق دوروزه باید بعد از تاریخ شروع باشد.',
    );
  }

  if (coversUntil !== addDaysIso(businessDate, 1)) {
    throw new BadRequestException(
      'صندوق دوروزه فقط برای دو روز پشت سر هم مجاز است.',
    );
  }

  assertDateAllowed(coversUntil);
}

/** `Date` دیتابیس → رشتهٔ `YYYY-MM-DD` برای مقایسه. */
export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
