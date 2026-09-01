import { describe, expect, it } from 'vitest';

import {
  CashStatus,
  calculateCashRegister,
  type CalculationInput,
} from './cash-calculation.js';
import {
  FormulaSide,
  TRANSACTION_TYPES,
  TransactionType,
} from './transaction-types.js';

describe('calculateCashRegister', () => {
  it('سناریوی واقعی فایل اکسل را بازتولید می‌کند', () => {
    // برگرفته از فایل «صندوق (3).xlsm»:
    //   B15 (مانده صندوق) = 16,000,000 − (1,000,000 + 2,000,000 + 2,000,000)
    //                     = 11,000,000
    //   B18 (جمع اسناد)   = 16,000,000
    //   B17 (اختلاف)      = 16,000,000 − 11,000,000 = 5,000,000 → مازاد صندوق
    const inputs: CalculationInput[] = [
      { type: TransactionType.SALES_TOTAL, amount: 16_000_000 },
      { type: TransactionType.GOODS_RETURN, amount: 1_000_000 },
      { type: TransactionType.EXPENSE_PAYMENT, amount: 2_000_000 },
      { type: TransactionType.BARTER, amount: 2_000_000 },
      { type: TransactionType.CASH, amount: 16_000_000 },
    ];

    const result = calculateCashRegister(inputs);

    expect(result.registerBalance).toBe(11_000_000n);
    expect(result.documentsTotal).toBe(16_000_000n);
    expect(result.difference).toBe(5_000_000n);
    expect(result.status).toBe(CashStatus.SURPLUS);
    expect(result.canClose).toBe(false);
  });

  it('وقتی جمع اسناد با مانده صندوق برابر است، صندوق تراز و قابل بستن است', () => {
    const result = calculateCashRegister([
      { type: TransactionType.SALES_TOTAL, amount: 10_000_000 },
      { type: TransactionType.GOODS_RETURN, amount: 2_000_000 },
      // مانده = 8,000,000 → اسناد باید دقیقاً همین باشد.
      { type: TransactionType.CASH, amount: 3_000_000 },
      { type: TransactionType.POS, amount: 4_000_000 },
      { type: TransactionType.CHEQUE, amount: 1_000_000 },
    ]);

    expect(result.registerBalance).toBe(8_000_000n);
    expect(result.documentsTotal).toBe(8_000_000n);
    expect(result.difference).toBe(0n);
    expect(result.status).toBe(CashStatus.BALANCED);
    expect(result.canClose).toBe(true);
  });

  it('کمبود اسناد نسبت به مانده را کسری صندوق تشخیص می‌دهد', () => {
    const result = calculateCashRegister([
      { type: TransactionType.SALES_TOTAL, amount: 5_000_000 },
      { type: TransactionType.CASH, amount: 4_500_000 },
    ]);

    expect(result.difference).toBe(-500_000n);
    expect(result.status).toBe(CashStatus.SHORTAGE);
    expect(result.canClose).toBe(false);
  });

  it('«واریز به مشتری» و «برگشت کالا» را در دو سمت مخالف حساب می‌کند', () => {
    // این دو قلم مشابه به‌نظر می‌رسند ولی طبق سند و اکسل جدا هستند:
    // واریز به مشتری مثبت و برگشت کالا منفی است.
    const result = calculateCashRegister([
      { type: TransactionType.CUSTOMER_REFUND, amount: 1_000_000 },
      { type: TransactionType.GOODS_RETURN, amount: 1_000_000 },
    ]);

    expect(result.breakdown.balanceAdditions).toBe(1_000_000n);
    expect(result.breakdown.balanceSubtractions).toBe(1_000_000n);
    expect(result.registerBalance).toBe(0n);
  });

  it('چند ردیف از یک نوع را جمع می‌زند (مثلاً چند کارتخوان)', () => {
    const result = calculateCashRegister([
      { type: TransactionType.POS, amount: 1_500_000 },
      { type: TransactionType.POS, amount: 850_000 },
      { type: TransactionType.POS, amount: 0 },
    ]);

    expect(result.totalsByType[TransactionType.POS]).toBe(2_350_000n);
    expect(result.documentsTotal).toBe(2_350_000n);
  });

  it('ورودی خالی را بدون خطا و با نتیجهٔ صفر برمی‌گرداند', () => {
    const result = calculateCashRegister([]);

    expect(result.registerBalance).toBe(0n);
    expect(result.documentsTotal).toBe(0n);
    expect(result.difference).toBe(0n);
    // صندوق خالی از نظر ریاضی تراز است؛ اجبار به پرکردن فیلدها
    // یک قانون جداگانه در لایهٔ بستن صندوق است، نه در موتور محاسبه.
    expect(result.status).toBe(CashStatus.BALANCED);
  });

  it('مبلغ منفی را رد می‌کند', () => {
    expect(() =>
      calculateCashRegister([
        { type: TransactionType.CASH, amount: -1 },
      ]),
    ).toThrow(/نمی‌تواند منفی باشد/);
  });

  it('مبلغ اعشاری را رد می‌کند (واحد ریال صحیح است)', () => {
    expect(() =>
      calculateCashRegister([
        { type: TransactionType.CASH, amount: 1000.5 },
      ]),
    ).toThrow(/عدد صحیح/);
  });

  it('نوع تراکنش ناشناخته را رد می‌کند', () => {
    expect(() =>
      calculateCashRegister([
        { type: 'not_a_real_type' as TransactionType, amount: 1 },
      ]),
    ).toThrow(/نوع تراکنش نامعتبر/);
  });

  it('مبالغ بسیار بزرگ را بدون خطای ممیز شناور محاسبه می‌کند', () => {
    // بیش از Number.MAX_SAFE_INTEGER — دلیل استفاده از bigint.
    const huge = 9_007_199_254_740_993n;
    const result = calculateCashRegister([
      { type: TransactionType.SALES_TOTAL, amount: huge },
      { type: TransactionType.CASH, amount: huge },
    ]);

    expect(result.difference).toBe(0n);
    expect(result.canClose).toBe(true);
  });
});

describe('جدول انواع تراکنش', () => {
  it('شناسه‌های تکراری ندارد', () => {
    const ids = TRANSACTION_TYPES.map((d) => d.type);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('هر سه سمت فرمول قلم دارند', () => {
    for (const side of Object.values(FormulaSide)) {
      const items = TRANSACTION_TYPES.filter((d) => d.side === side);
      expect(items.length).toBeGreaterThan(0);
    }
  });

  it('شامل هر ۶ قلم جمع اسناد طبق سند است', () => {
    const documentTypes = TRANSACTION_TYPES.filter(
      (d) => d.side === FormulaSide.DOCUMENT,
    ).map((d) => d.type);

    expect(documentTypes).toEqual([
      TransactionType.CHEQUE,
      TransactionType.POS,
      TransactionType.CARD_TO_CARD,
      TransactionType.CASH,
      TransactionType.FOREIGN_CURRENCY,
      TransactionType.ONLINE_GATEWAY,
    ]);
  });
});
