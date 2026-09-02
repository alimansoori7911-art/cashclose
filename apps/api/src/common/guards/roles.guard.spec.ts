import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { RolesGuard } from './roles.guard';
import type { RequestUser } from '../tenant/request-user';

function createContext(user?: Partial<RequestUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
  } as unknown as ExecutionContext;
}

function createGuard(requiredRoles?: UserRole[]) {
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;

  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('مسیر بدون @Roles برای هر کاربر احرازهویت‌شده باز است', () => {
    const guard = createGuard(undefined);
    expect(guard.canActivate(createContext({ role: UserRole.cashier }))).toBe(
      true,
    );
  });

  it('نقش مجاز را عبور می‌دهد', () => {
    const guard = createGuard([UserRole.accountant, UserRole.owner]);
    expect(
      guard.canActivate(createContext({ role: UserRole.accountant })),
    ).toBe(true);
  });

  it('نقش غیرمجاز را با ۴۰۳ رد می‌کند', () => {
    // صندوقدار نباید به مسیر مخصوص حسابدار دسترسی داشته باشد.
    const guard = createGuard([UserRole.accountant]);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.cashier })),
    ).toThrow(ForbiddenException);
  });

  it('وقتی کاربری روی درخواست نیست، مسیر را می‌بندد', () => {
    // حالت دفاعی: اگر به‌هر دلیل Guard احراز هویت اجرا نشده باشد، باز
    // گذاشتن مسیر یعنی نشت داده.
    const guard = createGuard([UserRole.owner]);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('فهرست نقش خالی محدودیتی اعمال نمی‌کند', () => {
    const guard = createGuard([]);
    expect(guard.canActivate(createContext({ role: UserRole.cashier }))).toBe(
      true,
    );
  });

  it('هر چهار نقش سند را درست تفکیک می‌کند', () => {
    const accountantOnly = createGuard([UserRole.accountant]);

    const allowed = [UserRole.accountant];
    const denied = [
      UserRole.cashier,
      UserRole.store_manager,
      UserRole.financial_manager,
      UserRole.owner,
    ];

    for (const role of allowed) {
      expect(accountantOnly.canActivate(createContext({ role }))).toBe(true);
    }

    for (const role of denied) {
      expect(() => accountantOnly.canActivate(createContext({ role }))).toThrow(
        ForbiddenException,
      );
    }
  });
});
