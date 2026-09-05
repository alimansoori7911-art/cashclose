import { describe, expect, it } from 'vitest';

import { requestContext, resolveRequestId } from './request-context';

describe('شناسهٔ درخواست', () => {
  it('UUID معتبر ورودی را نگه می‌دارد', () => {
    // ردیابی بین سرویس‌ها: اگر بالادست شناسه داده، همان ادامه پیدا کند.
    const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    expect(resolveRequestId(id)).toBe(id);
  });

  it('مقدار دلخواه کلاینت را نمی‌پذیرد', () => {
    // متن آزاد مستقیم در لاگ می‌نشیند و می‌تواند خط لاگ را جعل کند.
    const forged = 'not-a-uuid\nERROR fake log line';
    expect(resolveRequestId(forged)).not.toBe(forged);
  });

  it('برای هدر نبود، شناسهٔ تازه می‌سازد', () => {
    const first = resolveRequestId(undefined);
    const second = resolveRequestId(undefined);

    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(first).not.toBe(second);
  });

  it('هدر غیررشته‌ای را رد می‌کند', () => {
    expect(resolveRequestId(['a', 'b'])).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('حمل context در زنجیرهٔ async', () => {
  it('بیرون از درخواست خالی است', () => {
    expect(requestContext.get()).toBeUndefined();
    expect(requestContext.id()).toBe('-');
  });

  it('داخل run در دسترس است', () => {
    requestContext.run({ requestId: 'abc' }, () => {
      expect(requestContext.id()).toBe('abc');
    });
  });

  it('پس از await هم باقی می‌ماند', async () => {
    await requestContext.run({ requestId: 'xyz' }, async () => {
      await Promise.resolve();
      // نکتهٔ اصلی این طراحی: سرویسی که چند لایه پایین‌تر و پس از چند
      // await لاگ می‌نویسد، هنوز به شناسه دسترسی دارد.
      expect(requestContext.id()).toBe('xyz');
    });
  });

  it('کاربر پس از احراز هویت به context اضافه می‌شود', () => {
    requestContext.run({ requestId: 'r1' }, () => {
      requestContext.setUser('user-1', 'tenant-1');

      expect(requestContext.get()).toEqual({
        requestId: 'r1',
        userId: 'user-1',
        tenantId: 'tenant-1',
      });
    });
  });

  it('دو درخواست همزمان context یکدیگر را خراب نمی‌کنند', async () => {
    const seen: string[] = [];

    await Promise.all([
      requestContext.run({ requestId: 'aaa' }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        seen.push(requestContext.id());
      }),
      requestContext.run({ requestId: 'bbb' }, async () => {
        seen.push(requestContext.id());
      }),
    ]);

    expect(seen.sort()).toEqual(['aaa', 'bbb']);
  });
});
