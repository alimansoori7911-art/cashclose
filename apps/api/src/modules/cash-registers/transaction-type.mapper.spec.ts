import { describe, expect, it } from 'vitest';

import { enumDifference, enumsAreInSync } from './transaction-type.mapper';

describe('هم‌گامی enum انواع تراکنش', () => {
  it('enum پریزما و بستهٔ مشترک دقیقاً یکسان‌اند', () => {
    // این تست از یک باگ خاموش جلوگیری می‌کند: اگر قلمی فقط به یکی از دو
    // طرف اضافه شود، محاسبه یا ذخیره‌سازی بی‌سروصدا خراب می‌شود.
    const diff = enumDifference();

    expect(diff.onlyInPrisma, 'فقط در schema.prisma تعریف شده').toEqual([]);
    expect(diff.onlyInShared, 'فقط در بستهٔ shared تعریف شده').toEqual([]);
    expect(enumsAreInSync()).toBe(true);
  });
});
