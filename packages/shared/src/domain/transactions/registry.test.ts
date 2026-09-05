import { describe, expect, it } from 'vitest';

import {
  FormulaSide,
  getTransactionType,
  getTypesBySide,
  TRANSACTION_TYPES,
  TransactionType,
} from './index.js';

describe('جدول انواع تراکنش', () => {
  it('شناسهٔ تکراری ندارد', () => {
    const ids = TRANSACTION_TYPES.map((def) => def.type);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('همهٔ ۲۲ قلم سند را دارد', () => {
    expect(TRANSACTION_TYPES).toHaveLength(22);
  });

  it('هر سه سمت فرمول قلم دارند', () => {
    for (const side of Object.values(FormulaSide)) {
      expect(getTypesBySide(side).length).toBeGreaterThan(0);
    }
  });

  it('شامل هر ۶ قلم جمع اسناد، به ترتیب سند است', () => {
    const documentTypes = getTypesBySide(FormulaSide.DOCUMENT).map(
      (def) => def.type,
    );

    expect(documentTypes).toEqual([
      TransactionType.CHEQUE,
      TransactionType.POS,
      TransactionType.CARD_TO_CARD,
      TransactionType.CASH,
      TransactionType.FOREIGN_CURRENCY,
      TransactionType.ONLINE_GATEWAY,
    ]);
  });

  it('«واریز به مشتری» مثبت و «برگشت کالا» منفی است', () => {
    // این دو قلم شبیه به‌نظر می‌رسند ولی طبق سند و اکسل واقعی در دو سمت
    // مخالف فرمول قرار دارند.
    expect(getTransactionType(TransactionType.CUSTOMER_REFUND).side).toBe(
      FormulaSide.BALANCE_ADD,
    );
    expect(getTransactionType(TransactionType.GOODS_RETURN).side).toBe(
      FormulaSide.BALANCE_SUBTRACT,
    );
  });

  it('هر قلم برچسب فارسی و راهنما دارد', () => {
    for (const def of TRANSACTION_TYPES) {
      expect(def.label.trim()).not.toBe('');
      expect(def.hint.trim()).not.toBe('');
    }
  });

  it('فقط کارتخوان و کارت‌به‌کارت به دستگاه وصل می‌شوند', () => {
    // اگر قلم تازه‌ای اشتباهاً این پرچم را بگیرد، در فرم مدال تفکیک
    // دستگاه می‌گیرد که برایش بی‌معناست.
    const withTerminal = TRANSACTION_TYPES.filter(
      (def) => def.needsTerminal,
    ).map((def) => def.type);

    expect(withTerminal).toEqual([
      TransactionType.POS,
      TransactionType.CARD_TO_CARD,
    ]);
  });

  it('هر قلم نیازمند دستگاه، چندردیفی هم هست', () => {
    // تفکیک دستگاه بدون امکان افزودن ردیف معنا ندارد.
    for (const def of TRANSACTION_TYPES) {
      if (def.needsTerminal) expect(def.isMultiRow).toBe(true);
    }
  });

  it('نوع ناشناخته را رد می‌کند', () => {
    expect(() =>
      getTransactionType('not_a_real_type' as TransactionType),
    ).toThrow(/نوع تراکنش نامعتبر/);
  });
});
