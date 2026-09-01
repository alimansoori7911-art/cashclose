import { describe, expect, it } from 'vitest';

import { serializeBigInt } from './bigint.interceptor';

describe('serializeBigInt', () => {
  it('مبلغ BigInt را به عدد تبدیل می‌کند', () => {
    expect(serializeBigInt(16_000_000n)).toBe(16_000_000);
  });

  it('مقادیر تودرتو را هم تبدیل می‌کند', () => {
    const input = {
      id: 'abc',
      registerBalance: 11_000_000n,
      transactions: [{ amount: 1_500_000n }, { amount: 0n }],
    };

    expect(serializeBigInt(input)).toEqual({
      id: 'abc',
      registerBalance: 11_000_000,
      transactions: [{ amount: 1_500_000 }, { amount: 0 }],
    });
  });

  it('مقادیر خارج از محدودهٔ امن را به رشته تبدیل می‌کند تا دقت حفظ شود', () => {
    const huge = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
    expect(serializeBigInt(huge)).toBe('9007199254740993');
  });

  it('تاریخ را دست‌نخورده باقی می‌گذارد', () => {
    const date = new Date('2026-04-27T00:00:00Z');
    expect(serializeBigInt(date)).toBe(date);
  });

  it('null و مقادیر ساده را تغییر نمی‌دهد', () => {
    expect(serializeBigInt(null)).toBeNull();
    expect(serializeBigInt('متن')).toBe('متن');
    expect(serializeBigInt(42)).toBe(42);
  });
});
