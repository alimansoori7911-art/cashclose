import { BadRequestException, ConflictException } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { assertCanApprove, assertCanReject } from './review.rules';

describe('قاعدهٔ تأیید صندوق', () => {
  it('صندوق ارسال‌شده قابل تأیید است', () => {
    expect(() => assertCanApprove(CashRegisterStatus.submitted)).not.toThrow();
  });

  it('صندوق پیش‌نویس قابل تأیید نیست', () => {
    expect(() => assertCanApprove(CashRegisterStatus.draft)).toThrow(
      /هنوز توسط صندوقدار بسته نشده/,
    );
  });

  it('صندوق تأییدشده دوباره تأیید نمی‌شود', () => {
    expect(() => assertCanApprove(CashRegisterStatus.approved)).toThrow(
      /قبلاً تأیید شده/,
    );
  });

  it('صندوق ردشده تا ارسال دوباره قابل تأیید نیست', () => {
    expect(() => assertCanApprove(CashRegisterStatus.rejected)).toThrow(
      ConflictException,
    );
  });
});

describe('قاعدهٔ رد صندوق', () => {
  const REASON = 'مبلغ کارتخوان با رسید همخوانی ندارد.';

  it('صندوق ارسال‌شده با علت معتبر رد می‌شود', () => {
    expect(() =>
      assertCanReject(CashRegisterStatus.submitted, REASON),
    ).not.toThrow();
  });

  it('صندوق تأییدشده هم قابل رد است', () => {
    // بند ۱۱.۲ قاعدهٔ ۲: اگر بعداً خطایی کشف شد، باید بتوان برگرداند.
    expect(() =>
      assertCanReject(CashRegisterStatus.approved, REASON),
    ).not.toThrow();
  });

  it('رد بدون علت پذیرفته نمی‌شود', () => {
    expect(() =>
      assertCanReject(CashRegisterStatus.submitted, undefined),
    ).toThrow(BadRequestException);
    expect(() => assertCanReject(CashRegisterStatus.submitted, '')).toThrow(
      /ثبت علت الزامی/,
    );
  });

  it('علت فقط فاصله پذیرفته نمی‌شود', () => {
    expect(() =>
      assertCanReject(CashRegisterStatus.submitted, '    '),
    ).toThrow(/ثبت علت الزامی/);
  });

  it('صندوق پیش‌نویس قابل رد نیست', () => {
    expect(() => assertCanReject(CashRegisterStatus.draft, REASON)).toThrow(
      ConflictException,
    );
  });

  it('صندوق ردشده دوباره رد نمی‌شود', () => {
    expect(() => assertCanReject(CashRegisterStatus.rejected, REASON)).toThrow(
      /قبلاً رد شده/,
    );
  });

  it('علت پیش از بررسی وضعیت اعتبارسنجی می‌شود', () => {
    // حتی برای وضعیت نامعتبر، نبود علت خطای دقیق‌تری است.
    expect(() => assertCanReject(CashRegisterStatus.draft, '')).toThrow(
      BadRequestException,
    );
  });
});
