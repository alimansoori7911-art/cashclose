import { formatMoneyLatin, parseMoney } from '@cashclose/shared';
import { describe, expect, it } from 'vitest';

/**
 * این تست‌ها رفتار ورودی مبلغ را از دید کاربر پوشش می‌دهند — صندوقدار
 * ممکن است با کیبورد فارسی تایپ کند یا عدد را با جداکننده وارد کند.
 */
describe('ورودی مبلغ', () => {
  it('ارقام فارسی را می‌پذیرد', () => {
    expect(parseMoney('۱۲۳۴۵۶')).toBe(123456);
  });

  it('ارقام عربی را می‌پذیرد', () => {
    expect(parseMoney('١٢٣')).toBe(123);
  });

  it('جداکنندهٔ هزارگان را نادیده می‌گیرد', () => {
    expect(parseMoney('1,500,000')).toBe(1_500_000);
    expect(parseMoney('۱٬۵۰۰٬۰۰۰')).toBe(1_500_000);
  });

  it('ورودی نامعتبر را رد می‌کند', () => {
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('12.5')).toBeNull();
    expect(parseMoney('-500')).toBeNull();
    expect(parseMoney('')).toBeNull();
  });

  it('مبلغ بیش از ۹ رقم را رد می‌کند (بند ۹.۷ سند)', () => {
    expect(parseMoney('999999999')).toBe(999_999_999);
    expect(parseMoney('1000000000')).toBeNull();
  });

  it('خروجی نمایش، جداکنندهٔ هزارگان دارد', () => {
    expect(formatMoneyLatin(1_500_000)).toBe('1,500,000');
  });

  it('رفت‌وبرگشت مقدار را تغییر نمی‌دهد', () => {
    for (const value of [0, 1, 999, 1_500_000, 999_999_999]) {
      expect(parseMoney(formatMoneyLatin(value))).toBe(value);
    }
  });
});
