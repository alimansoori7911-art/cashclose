import { BadRequestException } from '@nestjs/common';

import { addDaysIso } from '@cashclose/shared';

import { assertDateAllowed } from './cash-register.rules';

/**
 * قواعد صندوق دوروزه (بند ۱۱ سند).
 *
 * صندوقدار گاهی دو روز پشت سر هم را یکجا می‌بندد — مثلاً جمعه و شنبه.
 * جدا از قواعد عمومی نگه داشته شده چون فلوی استثنایی است، نه مسیر
 * روزمره.
 */

/** تاریخ پایان باید دقیقاً روز بعدِ تاریخ شروع باشد. */
export function assertValidTwoDayRange(
  businessDate: string,
  coversUntil: string,
): void {
  if (coversUntil <= businessDate) {
    throw new BadRequestException(
      'تاریخ پایان صندوق دوروزه باید بعد از تاریخ شروع باشد.',
    );
  }

  // فاصلهٔ بیشتر یعنی چند روز فراموش شده؛ آن حالت با انتخاب تاریخ
  // عقب‌تر حل می‌شود، نه با صندوقی که چند روز را یکجا تراز کند.
  if (coversUntil !== addDaysIso(businessDate, 1)) {
    throw new BadRequestException(
      'صندوق دوروزه فقط برای دو روز پشت سر هم مجاز است.',
    );
  }

  assertDateAllowed(coversUntil);
}
