import { beforeEach, describe, expect, it, vi } from 'vitest';

import { session, type SessionUser } from './session';

const user: SessionUser = {
  id: 'u-1',
  tenantId: 't-1',
  username: 'cashier1',
  fullName: 'علی احمدی',
  role: 'cashier',
  branchId: 'b-1',
};

describe('مدیریت نشست', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('در ابتدا نشستی وجود ندارد', () => {
    expect(session.getToken()).toBeNull();
    expect(session.getUser()).toBeNull();
  });

  it('توکن و کاربر را ذخیره و بازیابی می‌کند', () => {
    session.save('jwt-token', user);

    expect(session.getToken()).toBe('jwt-token');
    expect(session.getUser()).toEqual(user);
  });

  it('با خروج، همه‌چیز پاک می‌شود', () => {
    session.save('jwt-token', user);
    session.clear();

    expect(session.getToken()).toBeNull();
    expect(session.getUser()).toBeNull();
  });

  it('دادهٔ خراب باعث خطا نمی‌شود و خودش را پاک می‌کند', () => {
    // اگر این throw می‌کرد، کاربر با یک رکورد خراب برای همیشه گیر می‌کرد.
    localStorage.setItem('cashclose.user', 'not-valid-json{{{');

    expect(session.getUser()).toBeNull();
    expect(localStorage.getItem('cashclose.user')).toBeNull();
  });

  it('وقتی حافظهٔ مرورگر در دسترس نیست، برنامه نمی‌شکند', () => {
    // حالت مرور ناشناس در بعضی مرورگرها این خطا را می‌دهد.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(session.getToken()).toBeNull();
  });

  it('ناتوانی در ذخیره، خطا پرتاب نمی‌کند', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => session.save('t', user)).not.toThrow();
  });
});
