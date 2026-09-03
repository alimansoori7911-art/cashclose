import { BadRequestException, ConflictException } from '@nestjs/common';
import { CashRegisterStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { addDaysIso, todayIso } from '@cashclose/shared';

import {
  assertCanClose,
  assertDateAllowed,
  assertEditable,
  assertNoBlockingRegister,
  assertValidTwoDayRange,
  isEditable,
  isOpen,
} from './cash-register.rules';

const TODAY = todayIso();
const YESTERDAY = addDaysIso(TODAY, -1);
const TOMORROW = addDaysIso(TODAY, 1);

describe('قاعدهٔ تاریخ صندوق', () => {
  it('امروز مجاز است', () => {
    expect(() => assertDateAllowed(TODAY)).not.toThrow();
  });

  it('دیروز مجاز است', () => {
    expect(() => assertDateAllowed(YESTERDAY)).not.toThrow();
  });

  it('تاریخ آینده رد می‌شود', () => {
    expect(() => assertDateAllowed(TOMORROW)).toThrow(BadRequestException);
    expect(() => assertDateAllowed(TOMORROW)).toThrow(/آینده/);
  });

  it('تاریخ قدیمی‌تر از دیروز رد می‌شود', () => {
    expect(() => assertDateAllowed(addDaysIso(TODAY, -2))).toThrow(
      /امروز یا دیروز/,
    );
  });
});

describe('قاعدهٔ صندوق باز', () => {
  it('بدون صندوق باز، ساخت مجاز است', () => {
    expect(() => assertNoBlockingRegister([], TODAY)).not.toThrow();
  });

  it('صندوق تکراری برای همان تاریخ رد می‌شود', () => {
    const existing = [
      { businessDate: new Date(TODAY), status: CashRegisterStatus.draft },
    ];

    expect(() => assertNoBlockingRegister(existing, TODAY)).toThrow(
      ConflictException,
    );
    expect(() => assertNoBlockingRegister(existing, TODAY)).toThrow(
      /قبلاً صندوقی ایجاد شده/,
    );
  });

  it('صندوق باز روز قبل، مانع ساخت صندوق امروز است', () => {
    // مهم‌ترین قاعدهٔ سند: تا نبستن روز قبل، روز جدید ممنوع.
    const existing = [
      { businessDate: new Date(YESTERDAY), status: CashRegisterStatus.draft },
    ];

    expect(() => assertNoBlockingRegister(existing, TODAY)).toThrow(
      /روزهای قبل بسته نشود/,
    );
  });

  it('صندوق ردشده هم مانع محسوب می‌شود', () => {
    // صندوق rejected یعنی کار ناتمام؛ باید اصلاح و دوباره ارسال شود.
    const existing = [
      {
        businessDate: new Date(YESTERDAY),
        status: CashRegisterStatus.rejected,
      },
    ];

    expect(() => assertNoBlockingRegister(existing, TODAY)).toThrow(
      ConflictException,
    );
  });
});

describe('قاعدهٔ بستن صندوق', () => {
  it('اختلاف صفر اجازهٔ بستن می‌دهد', () => {
    expect(() =>
      assertCanClose(CashRegisterStatus.draft, 0n),
    ).not.toThrow();
  });

  it('اختلاف مثبت (مازاد) اجازهٔ بستن نمی‌دهد', () => {
    expect(() => assertCanClose(CashRegisterStatus.draft, 5_000_000n)).toThrow(
      /اختلاف صندوق صفر نشود/,
    );
  });

  it('اختلاف منفی (کسری) اجازهٔ بستن نمی‌دهد', () => {
    expect(() =>
      assertCanClose(CashRegisterStatus.draft, -1_500_000n),
    ).toThrow(BadRequestException);
  });

  it('صندوق ردشده پس از اصلاح قابل بستن است', () => {
    expect(() =>
      assertCanClose(CashRegisterStatus.rejected, 0n),
    ).not.toThrow();
  });

  it('صندوق ارسال‌شده دوباره بسته نمی‌شود', () => {
    expect(() => assertCanClose(CashRegisterStatus.submitted, 0n)).toThrow(
      /قبلاً بسته/,
    );
  });

  it('صندوق تأییدشده قابل بستن نیست', () => {
    expect(() => assertCanClose(CashRegisterStatus.approved, 0n)).toThrow(
      /تأیید شده/,
    );
  });
});

describe('قاعدهٔ ویرایش', () => {
  it('پیش‌نویس و ردشده قابل ویرایش‌اند', () => {
    expect(isEditable(CashRegisterStatus.draft)).toBe(true);
    expect(isEditable(CashRegisterStatus.rejected)).toBe(true);
  });

  it('ارسال‌شده و تأییدشده قابل ویرایش نیستند', () => {
    expect(isEditable(CashRegisterStatus.submitted)).toBe(false);
    expect(isEditable(CashRegisterStatus.approved)).toBe(false);
    expect(() => assertEditable(CashRegisterStatus.submitted)).toThrow(
      ConflictException,
    );
  });

  it('سه وضعیت «باز» درست تشخیص داده می‌شوند', () => {
    expect(isOpen(CashRegisterStatus.draft)).toBe(true);
    expect(isOpen(CashRegisterStatus.submitted)).toBe(true);
    expect(isOpen(CashRegisterStatus.rejected)).toBe(true);
    expect(isOpen(CashRegisterStatus.approved)).toBe(false);
  });
});

describe('قاعدهٔ صندوق دوروزه', () => {
  it('دو روز پشت سر هم مجاز است', () => {
    expect(() =>
      assertValidTwoDayRange(YESTERDAY, TODAY),
    ).not.toThrow();
  });

  it('فاصلهٔ بیش از یک روز رد می‌شود', () => {
    expect(() =>
      assertValidTwoDayRange(addDaysIso(TODAY, -3), TODAY),
    ).toThrow(/دو روز پشت سر هم/);
  });

  it('تاریخ پایان پیش از شروع رد می‌شود', () => {
    expect(() => assertValidTwoDayRange(TODAY, YESTERDAY)).toThrow(
      /بعد از تاریخ شروع/,
    );
  });
});
