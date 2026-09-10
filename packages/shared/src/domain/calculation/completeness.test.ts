import { describe, expect, it } from 'vitest';

import { TransactionType } from '../transactions/index.js';
import {
  findMissingRequired,
  needsExplanation,
  type CompletenessRow,
} from './completeness.js';

function row(overrides: Partial<CompletenessRow> = {}): CompletenessRow {
  return {
    type: TransactionType.SALES_TOTAL,
    amount: 1_000_000,
    description: '',
    imageCount: 0,
    ...overrides,
  };
}

describe('بررسی اقلام اجباری', () => {
  it('ردیف بدون مبلغ اصلاً بررسی نمی‌شود', () => {
    // مبلغ صفر یعنی آن قلم امروز رخ نداده؛ مطالبهٔ عکس بی‌معناست.
    expect(findMissingRequired([row({ amount: 0 })])).toEqual([]);
  });

  it('نبودِ عکس اجباری گزارش می‌شود', () => {
    const missing = findMissingRequired([row({ imageCount: 0 })]);

    expect(missing).toHaveLength(1);
    expect(missing[0]?.missingImages).toBe(true);
    expect(missing[0]?.label).toBe('فروش کل');
  });

  it('با وجود عکس، ایرادی گرفته نمی‌شود', () => {
    expect(findMissingRequired([row({ imageCount: 1 })])).toEqual([]);
  });

  it('نبودِ عکس، توضیح را اجباری می‌کند', () => {
    // این هستهٔ تصمیم است: عکس نداری، پس بنویس چرا.
    const missing = findMissingRequired([
      row({ imageCount: 0, description: '' }),
    ]);

    expect(missing[0]?.missingDescription).toBe(true);
  });

  it('توضیحِ دلیل، نبودِ عکس را جبران می‌کند', () => {
    const missing = findMissingRequired([
      row({ imageCount: 0, description: 'اسکنر خراب بود؛ رسید کاغذی نزد من است.' }),
    ]);

    // کمبود عکس همچنان گزارش می‌شود تا حسابدار بداند...
    expect(missing[0]?.missingImages).toBe(true);
    // ...ولی چون دلیل نوشته شده، جلوی بستن گرفته نمی‌شود.
    expect(missing[0]?.missingDescription).toBe(false);
    expect(needsExplanation(missing)).toBe(false);
  });

  it('توضیح از فاصله پر نمی‌شود', () => {
    const missing = findMissingRequired([
      row({ imageCount: 0, description: '   ' }),
    ]);

    expect(missing[0]?.missingDescription).toBe(true);
  });

  it('قلمی که توضیح اجباری دارد، بدون آن گزارش می‌شود', () => {
    const missing = findMissingRequired([
      row({ type: TransactionType.CASH_SURPLUS, description: '' }),
    ]);

    expect(missing[0]?.missingDescription).toBe(true);
    // مازاد صندوق عکس ندارد، پس کمبود عکس بی‌معناست.
    expect(missing[0]?.missingImages).toBe(false);
  });

  it('قلم بدون هیچ اجباری، همیشه کامل است', () => {
    const missing = findMissingRequired([
      row({ type: TransactionType.CASH, description: '', imageCount: 0 }),
    ]);

    expect(missing).toEqual([]);
  });

  it('چند ردیف ناقص همه گزارش می‌شوند', () => {
    const missing = findMissingRequired([
      row({ type: TransactionType.SALES_TOTAL }),
      row({ type: TransactionType.CHEQUE }),
      row({ type: TransactionType.CASH, amount: 500_000 }),
    ]);

    expect(missing).toHaveLength(2);
    expect(missing.map((m) => m.label)).toEqual([
      'فروش کل',
      'چک‌های دریافتی',
    ]);
  });

  it('نیاز به توضیح فقط با نبودِ متن اعلام می‌شود', () => {
    const withText = findMissingRequired([
      row({ imageCount: 0, description: 'دلیل' }),
    ]);
    const withoutText = findMissingRequired([row({ imageCount: 0 })]);

    expect(needsExplanation(withText)).toBe(false);
    expect(needsExplanation(withoutText)).toBe(true);
  });
});
