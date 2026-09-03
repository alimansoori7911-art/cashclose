import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import type { RequestUser } from '../../common/tenant/request-user';
import {
  assertBranchMatchesRole,
  assertCanAssignRole,
  assertCanModifyTarget,
  assertNotSelfModification,
} from './users.rules';

function actor(role: UserRole, id = 'actor-1'): RequestUser {
  return {
    id,
    tenantId: 't-1',
    username: 'someone',
    role,
    branchId: null,
  };
}

describe('قاعدهٔ شعبه و نقش', () => {
  it('صندوقدار بدون شعبه پذیرفته نمی‌شود', () => {
    expect(() => assertBranchMatchesRole(UserRole.cashier, null)).toThrow(
      BadRequestException,
    );
    expect(() => assertBranchMatchesRole(UserRole.cashier, undefined)).toThrow(
      /شعبه الزامی/,
    );
  });

  it('صندوقدار با شعبه پذیرفته می‌شود', () => {
    expect(() =>
      assertBranchMatchesRole(UserRole.cashier, 'branch-1'),
    ).not.toThrow();
  });

  it('نقش‌های ستادی بدون شعبه مجازند', () => {
    for (const role of [
      UserRole.accountant,
      UserRole.store_manager,
      UserRole.financial_manager,
      UserRole.owner,
    ]) {
      expect(() => assertBranchMatchesRole(role, null)).not.toThrow();
    }
  });
});

describe('قاعدهٔ تخصیص نقش', () => {
  it('مدیر فروشگاه نمی‌تواند نقش مالک بدهد', () => {
    // بدون این قاعده، مدیر می‌توانست خودش را مالک کند — ارتقای دسترسی.
    expect(() =>
      assertCanAssignRole(actor(UserRole.store_manager), UserRole.owner),
    ).toThrow(ForbiddenException);
  });

  it('مالک می‌تواند نقش مالک بدهد', () => {
    expect(() =>
      assertCanAssignRole(actor(UserRole.owner), UserRole.owner),
    ).not.toThrow();
  });

  it('مدیر فروشگاه می‌تواند نقش‌های عادی بدهد', () => {
    for (const role of [
      UserRole.cashier,
      UserRole.accountant,
      UserRole.financial_manager,
    ]) {
      expect(() =>
        assertCanAssignRole(actor(UserRole.store_manager), role),
      ).not.toThrow();
    }
  });
});

describe('قاعدهٔ تغییر حساب خود', () => {
  it('کاربر نمی‌تواند نقش خودش را عوض کند', () => {
    expect(() =>
      assertNotSelfModification(actor(UserRole.store_manager, 'u-1'), 'u-1', {
        role: UserRole.owner,
      }),
    ).toThrow(BadRequestException);
  });

  it('کاربر نمی‌تواند خودش را غیرفعال کند', () => {
    // جلوی قفل‌شدن تصادفی مدیر بیرون از سامانه را می‌گیرد.
    expect(() =>
      assertNotSelfModification(actor(UserRole.owner, 'u-1'), 'u-1', {
        status: UserStatus.inactive,
      }),
    ).toThrow(/حساب خودتان/);
  });

  it('تغییر نام خود مجاز است', () => {
    expect(() =>
      assertNotSelfModification(actor(UserRole.owner, 'u-1'), 'u-1', {}),
    ).not.toThrow();
  });

  it('تغییر نقش کاربر دیگر مجاز است', () => {
    expect(() =>
      assertNotSelfModification(actor(UserRole.owner, 'u-1'), 'u-2', {
        role: UserRole.cashier,
      }),
    ).not.toThrow();
  });
});

describe('قاعدهٔ تغییر کاربر هدف', () => {
  it('مدیر فروشگاه نمی‌تواند حساب مالک را تغییر دهد', () => {
    expect(() =>
      assertCanModifyTarget(actor(UserRole.store_manager), UserRole.owner),
    ).toThrow(ForbiddenException);
  });

  it('مالک می‌تواند حساب مالک دیگر را تغییر دهد', () => {
    expect(() =>
      assertCanModifyTarget(actor(UserRole.owner), UserRole.owner),
    ).not.toThrow();
  });
});
