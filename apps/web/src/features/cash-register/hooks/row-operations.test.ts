import { TransactionType } from '@cashclose/shared';
import { describe, expect, it } from 'vitest';

import { createRow, findOrCreateEmpty, patchRow } from './row-operations';

describe('یافتن یا ساخت ردیف', () => {
  it('ردیف خالیِ موجود را برمی‌گرداند، نه ردیف تازه', () => {
    // باگ واقعی: دکمهٔ پیشنهاد ردیف تکراری می‌ساخت، چون هر قلم از قبل
    // یک ردیف خالی در فرم دارد.
    const rows = [createRow(TransactionType.UNSETTLED_PURCHASE)];

    const result = findOrCreateEmpty(rows, TransactionType.UNSETTLED_PURCHASE);

    expect(result.rows).toHaveLength(1);
    expect(result.key).toBe(rows[0]?.key);
  });

  it('وقتی ردیف موجود مبلغ دارد، ردیف تازه می‌سازد', () => {
    const rows = [
      createRow(TransactionType.CHEQUE, { amount: 500_000 }),
    ];

    const result = findOrCreateEmpty(rows, TransactionType.CHEQUE);

    expect(result.rows).toHaveLength(2);
    expect(result.key).not.toBe(rows[0]?.key);
  });

  it('برای قلمی که هیچ ردیفی ندارد، ردیف می‌سازد', () => {
    const result = findOrCreateEmpty([], TransactionType.BARTER);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.type).toBe(TransactionType.BARTER);
  });

  it('ردیف خالیِ قلم دیگر را اشتباهی برنمی‌گرداند', () => {
    const rows = [createRow(TransactionType.CHEQUE)];

    const result = findOrCreateEmpty(rows, TransactionType.BARTER);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]?.type).toBe(TransactionType.BARTER);
  });
});

describe('ویرایش ردیف', () => {
  it('فقط ردیف هدف تغییر می‌کند', () => {
    const rows = [
      createRow(TransactionType.CASH),
      createRow(TransactionType.CHEQUE),
    ];
    const key = rows[0]?.key ?? '';

    const next = patchRow(rows, key, { amount: 100 });

    expect(next[0]?.amount).toBe(100);
    expect(next[1]?.amount).toBeNull();
  });

  it('کلید ناشناخته چیزی را خراب نمی‌کند', () => {
    const rows = [createRow(TransactionType.CASH)];

    expect(patchRow(rows, 'no-such-key', { amount: 5 })).toEqual(rows);
  });
});
