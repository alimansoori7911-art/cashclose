import { describe, expect, it } from 'vitest';

import { diffVersions, type VersionPayload } from './version-diff';

function payload(
  transactions: {
    type: string;
    amount: string;
    description?: string | null;
  }[],
  totals: Partial<Pick<VersionPayload, 'registerBalance' | 'documentsTotal' | 'difference'>> = {},
): VersionPayload {
  return {
    registerBalance: totals.registerBalance ?? '0',
    documentsTotal: totals.documentsTotal ?? '0',
    difference: totals.difference ?? '0',
    transactions: transactions.map((t, index) => ({
      type: t.type,
      amount: t.amount,
      description: t.description ?? null,
      terminalId: null,
      sortOrder: index,
    })),
  };
}

describe('مقایسهٔ نسخه‌های صندوق', () => {
  it('تغییر مبلغ یک قلم را تشخیص می‌دهد', () => {
    const before = payload([{ type: 'pos', amount: '9000000' }]);
    const after = payload([{ type: 'pos', amount: '7000000' }]);

    const diff = diffVersions(before, after);
    const pos = diff.transactions.find((t) => t.type === 'pos');

    expect(pos?.kind).toBe('changed');
    expect(pos?.before?.amount).toBe('9000000');
    expect(pos?.after?.amount).toBe('7000000');
    expect(diff.changedCount).toBe(1);
  });

  it('قلم اضافه‌شده را تشخیص می‌دهد', () => {
    const before = payload([{ type: 'sales_total', amount: '5000000' }]);
    const after = payload([
      { type: 'sales_total', amount: '5000000' },
      { type: 'cheque', amount: '2000000' },
    ]);

    const diff = diffVersions(before, after);
    expect(diff.transactions.find((t) => t.type === 'cheque')?.kind).toBe(
      'added',
    );
  });

  it('قلم حذف‌شده را تشخیص می‌دهد', () => {
    const before = payload([
      { type: 'sales_total', amount: '5000000' },
      { type: 'barter', amount: '1000000' },
    ]);
    const after = payload([{ type: 'sales_total', amount: '5000000' }]);

    const diff = diffVersions(before, after);
    expect(diff.transactions.find((t) => t.type === 'barter')?.kind).toBe(
      'removed',
    );
  });

  it('قلم بدون تغییر را unchanged علامت می‌زند', () => {
    const same = payload([{ type: 'cash', amount: '3000000' }]);
    const diff = diffVersions(same, same);

    expect(diff.transactions[0]?.kind).toBe('unchanged');
    expect(diff.changedCount).toBe(0);
  });

  it('چند ردیف از یک نوع را جمع می‌زند', () => {
    // صندوقدار سه چک را به دو چک تبدیل کرده؛ آنچه مهم است تغییر جمع است.
    const before = payload([
      { type: 'cheque', amount: '1000000' },
      { type: 'cheque', amount: '2000000' },
      { type: 'cheque', amount: '3000000' },
    ]);
    const after = payload([
      { type: 'cheque', amount: '2000000' },
      { type: 'cheque', amount: '4000000' },
    ]);

    const diff = diffVersions(before, after);
    const cheque = diff.transactions.find((t) => t.type === 'cheque');

    expect(cheque?.before?.amount).toBe('6000000');
    expect(cheque?.after?.amount).toBe('6000000');
    // جمع یکسان است، پس تغییری ثبت نمی‌شود.
    expect(cheque?.kind).toBe('unchanged');
  });

  it('تغییر توضیح هم تغییر محسوب می‌شود', () => {
    const before = payload([
      { type: 'barter', amount: '1000000', description: 'فاکتور ۱۰۰' },
    ]);
    const after = payload([
      { type: 'barter', amount: '1000000', description: 'فاکتور ۲۰۰' },
    ]);

    expect(diffVersions(before, after).changedCount).toBe(1);
  });

  it('تغییر جمع‌های کلی را گزارش می‌کند', () => {
    const before = payload([], {
      registerBalance: '15000000',
      documentsTotal: '15000000',
      difference: '0',
    });
    const after = payload([], {
      registerBalance: '15000000',
      documentsTotal: '13000000',
      difference: '-2000000',
    });

    const diff = diffVersions(before, after);
    expect(diff.totals.registerBalance.changed).toBe(false);
    expect(diff.totals.documentsTotal.changed).toBe(true);
    expect(diff.totals.difference.after).toBe('-2000000');
  });

  it('تغییرات را پیش از موارد بدون تغییر مرتب می‌کند', () => {
    const before = payload([
      { type: 'cash', amount: '1000000' },
      { type: 'pos', amount: '5000000' },
    ]);
    const after = payload([
      { type: 'cash', amount: '1000000' },
      { type: 'pos', amount: '9000000' },
    ]);

    const diff = diffVersions(before, after);
    // ردیف تغییرکرده باید اول باشد تا حسابدار دنبالش نگردد.
    expect(diff.transactions[0]?.type).toBe('pos');
  });

  it('مبالغ بسیار بزرگ را بدون خطای دقت مقایسه می‌کند', () => {
    const huge = '9007199254740993'; // بیش از MAX_SAFE_INTEGER
    const before = payload([{ type: 'cash', amount: huge }]);
    const after = payload([{ type: 'cash', amount: '9007199254740994' }]);

    const diff = diffVersions(before, after);
    expect(diff.transactions[0]?.kind).toBe('changed');
  });

  it('نسخهٔ بدون تراکنش را بدون خطا مدیریت می‌کند', () => {
    expect(() => diffVersions(payload([]), payload([]))).not.toThrow();
  });
});
