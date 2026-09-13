import { describe, expect, it } from 'vitest';

import { TRANSACTION_TYPES } from './registry.js';
import {
  isPrimaryType,
  PRIMARY_TYPES,
  splitBySide,
  suggestForDifference,
} from './prominence.js';
import { FormulaSide, TransactionType } from './types.js';

describe('تفکیک اقلام پرکاربرد', () => {
  it('چهار قلم اصلی شناخته می‌شوند', () => {
    expect(isPrimaryType(TransactionType.SALES_TOTAL)).toBe(true);
    expect(isPrimaryType(TransactionType.POS)).toBe(true);
    expect(isPrimaryType(TransactionType.CASH)).toBe(true);
    expect(isPrimaryType(TransactionType.GOODS_RETURN)).toBe(true);
  });

  it('قلم نادر پرکاربرد شمرده نمی‌شود', () => {
    expect(isPrimaryType(TransactionType.FOREIGN_CURRENCY)).toBe(false);
    expect(isPrimaryType(TransactionType.BARTER)).toBe(false);
  });

  it('هر قلم اصلی واقعاً در جدول اقلام وجود دارد', () => {
    // اگر نوعی حذف یا تغییر نام بدهد، این تست زودتر از UI می‌شکند.
    const all = TRANSACTION_TYPES.map((d) => d.type);
    for (const type of PRIMARY_TYPES) {
      expect(all).toContain(type);
    }
  });

  it('هیچ قلمی دو بار در فهرست اصلی نیست', () => {
    expect(new Set(PRIMARY_TYPES).size).toBe(PRIMARY_TYPES.length);
  });
});

describe('پیشنهاد رفع اختلاف', () => {
  const filled: TransactionType[] = [];

  it('صندوق تراز پیشنهادی ندارد', () => {
    expect(suggestForDifference(0, filled)).toEqual([]);
  });

  it('کسری، اقلام کاهندهٔ مانده را پیشنهاد می‌دهد', () => {
    // کسری یعنی اسناد کمتر از مانده؛ پس قلم منفی جا افتاده.
    const result = suggestForDifference(-1_000_000, filled);

    expect(result).toContain(TransactionType.UNSETTLED_PURCHASE);
    expect(result).toContain(TransactionType.CASH_SHORTAGE);
    expect(result).not.toContain(TransactionType.DEBT_RECEIPT);
  });

  it('مازاد، اقلام افزایندهٔ مانده را پیشنهاد می‌دهد', () => {
    const result = suggestForDifference(1_000_000, filled);

    expect(result).toContain(TransactionType.DEBT_RECEIPT);
    expect(result).toContain(TransactionType.CASH_SURPLUS);
    expect(result).not.toContain(TransactionType.UNSETTLED_PURCHASE);
  });

  it('قلمی که از قبل پر شده دوباره پیشنهاد نمی‌شود', () => {
    const result = suggestForDifference(-1_000_000, [
      TransactionType.UNSETTLED_PURCHASE,
    ]);

    expect(result).not.toContain(TransactionType.UNSETTLED_PURCHASE);
    expect(result).toContain(TransactionType.CASH_SHORTAGE);
  });

  it('پیشنهادها فقط از اقلام معتبر می‌آیند', () => {
    const all = TRANSACTION_TYPES.map((d) => d.type);
    for (const type of suggestForDifference(-1, [])) {
      expect(all).toContain(type);
    }
    for (const type of suggestForDifference(1, [])) {
      expect(all).toContain(type);
    }
  });
});

describe('تفکیک دو سمت معادله', () => {
  const all = TRANSACTION_TYPES.map((d) => d.type);

  it('سمت اسناد، کارتخوان و نقدی را اصلی می‌گیرد', () => {
    const { primary, secondary } = splitBySide(all, FormulaSide.DOCUMENT);

    expect(primary).toEqual([TransactionType.POS, TransactionType.CASH]);
    expect(secondary).toContain(TransactionType.CHEQUE);
  });

  it('سمت مانده هر دو جهت مثبت و منفی را می‌گیرد', () => {
    const { primary } = splitBySide(all, [
      FormulaSide.BALANCE_ADD,
      FormulaSide.BALANCE_SUBTRACT,
    ]);

    // فروش کل مثبت است و برگشت کالا منفی؛ هر دو باید بیایند.
    expect(primary).toContain(TransactionType.SALES_TOTAL);
    expect(primary).toContain(TransactionType.GOODS_RETURN);
  });

  it('مجموع دو دسته برابر کل اقلام آن سمت است', () => {
    const { primary, secondary } = splitBySide(all, FormulaSide.DOCUMENT);
    const expected = all.filter(
      (t) =>
        TRANSACTION_TYPES.find((d) => d.type === t)?.side ===
        FormulaSide.DOCUMENT,
    );

    expect(primary.length + secondary.length).toBe(expected.length);
  });
});
