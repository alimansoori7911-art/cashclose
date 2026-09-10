import { BadRequestException, ConflictException } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';

import { addDaysIso, MAX_BACKDATE_DAYS, todayIso } from '@cashclose/shared';

export { MAX_BACKDATE_DAYS };

/**
 * قواعد کسب‌وکاری صندوق روزانه (بخش ۱۱.۱ سند).
 *
 * جدا از دسترسی به دیتابیس نگه داشته شده تا مستقل و بدون نیاز به
 * دیتابیس تست شوند — این قواعد قلب سامانه‌اند و باید قطعی باشند.
 */

/**
 * وضعیت‌هایی که مانع ساخت صندوق جدیدند.
 *
 * سند (بند ۱۱.۱) می‌گوید «اگر صندوقدار صندوق روز گذشته را **نبسته**
 * باشد» — یعنی کاری که خودِ صندوقدار باید انجام دهد و نداده است.
 *
 * صندوق ارسال‌شده عمداً اینجا نیست: توپ در زمین حسابدار است، نه
 * صندوقدار. اگر حسابدار چند روز نیاید (تعطیلی اداری) ولی فروشگاه باز
 * باشد، صندوقدار نباید بیکار بماند.
 */
export const OPEN_STATUSES: readonly CashRegisterStatus[] = [
  CashRegisterStatus.draft,
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
 * تاریخ صندوق: از امروز تا حداکثر یک هفته پیش (بند ۱۱.۱ قاعدهٔ ۲).
 *
 * صندوق آینده بی‌معناست. برای گذشته سقف وجود دارد تا خطای تایپ تاریخ
 * به سال‌ها قبل نرود، ولی آن‌قدر هست که تعطیلی چندروزه را پوشش دهد.
 */
export function assertDateAllowed(businessDate: string): void {
  const today = todayIso();
  const earliest = addDaysIso(today, -MAX_BACKDATE_DAYS);

  if (businessDate > today) {
    throw new BadRequestException(
      'ساخت صندوق برای تاریخ آینده مجاز نیست.',
    );
  }

  if (businessDate < earliest) {
    throw new BadRequestException(
      `صندوق حداکثر تا ${MAX_BACKDATE_DAYS} روز گذشته قابل ایجاد است. برای روزهای قدیمی‌تر با مدیر تماس بگیرید.`,
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

/** `Date` دیتابیس → رشتهٔ `YYYY-MM-DD` برای مقایسه. */
export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
