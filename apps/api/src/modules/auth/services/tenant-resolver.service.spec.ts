import { describe, expect, it, vi } from 'vitest';

import { TenantResolverService } from './tenant-resolver.service';

/** استخراج زیردامنه به دیتابیس نیازی ندارد. */
const resolver = new TenantResolverService(
  null as unknown as ConstructorParameters<typeof TenantResolverService>[0],
);

describe('استخراج زیردامنهٔ مجموعه', () => {
  it('زیردامنه را از آدرس کامل جدا می‌کند', () => {
    expect(resolver.extractSlug('refah.cashclose.ir')).toBe('refah');
  });

  it('پورت را نادیده می‌گیرد', () => {
    expect(resolver.extractSlug('refah.cashclose.ir:8080')).toBe('refah');
  });

  it('حروف بزرگ را کوچک می‌کند', () => {
    // دامنه به بزرگی حروف حساس نیست ولی مقایسهٔ ما هست.
    expect(resolver.extractSlug('REFAH.CashClose.ir')).toBe('refah');
  });

  it('دامنهٔ اصلی مجموعه‌ای ندارد', () => {
    expect(resolver.extractSlug('cashclose.ir')).toBeNull();
  });

  it('آی‌پی خام زیردامنه ندارد', () => {
    // استقرار فعلی روی آی‌پی است؛ نباید `2` را زیردامنه بفهمد.
    expect(resolver.extractSlug('2.144.26.1')).toBeNull();
    expect(resolver.extractSlug('2.144.26.1:443')).toBeNull();
  });

  it('localhost زیردامنه ندارد', () => {
    expect(resolver.extractSlug('localhost')).toBeNull();
    expect(resolver.extractSlug('localhost:5173')).toBeNull();
  });

  it('میزبان خالی یا نامشخص را رد می‌کند', () => {
    expect(resolver.extractSlug(undefined)).toBeNull();
    expect(resolver.extractSlug('')).toBeNull();
  });

  it('زیردامنه‌های رزروشده مجموعه محسوب نمی‌شوند', () => {
    // اگر مشتری `api` را بردارد، با آدرس خود سرویس تداخل می‌کند.
    expect(resolver.extractSlug('api.cashclose.ir')).toBeNull();
    expect(resolver.extractSlug('www.cashclose.ir')).toBeNull();
    expect(resolver.extractSlug('admin.cashclose.ir')).toBeNull();
  });

  it('زیردامنهٔ چندسطحی، اولین بخش را می‌گیرد', () => {
    expect(resolver.extractSlug('refah.shop.cashclose.ir')).toBe('refah');
  });
});

describe('تشخیص مجموعه از کد کسب‌وکار', () => {
  function withTenant(found: { id: string } | null) {
    const prisma = {
      tenant: { findUnique: vi.fn(async () => found) },
    };
    return {
      service: new TenantResolverService(prisma as never),
      prisma,
    };
  }

  it('کد معتبر شناسهٔ مجموعه را برمی‌گرداند', async () => {
    const { service } = withTenant({ id: 'tenant-1' });

    expect(await service.resolveByCode('RFH12345')).toBe('tenant-1');
  });

  it('حروف کوچک هم پذیرفته می‌شود', async () => {
    // کاربر ممکن است کد را هر طور بنویسد.
    const { service, prisma } = withTenant({ id: 'tenant-1' });

    await service.resolveByCode('rfh12345');

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'RFH12345' } }),
    );
  });

  it('فاصلهٔ اضافه حذف می‌شود', async () => {
    const { service, prisma } = withTenant({ id: 'tenant-1' });

    await service.resolveByCode('  RFH12345  ');

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'RFH12345' } }),
    );
  });

  it('کد ناشناخته null می‌دهد', async () => {
    const { service } = withTenant(null);

    expect(await service.resolveByCode('NOSUCH12')).toBeNull();
  });

  it('کد خالی بدون تماس با دیتابیس رد می‌شود', async () => {
    const { service, prisma } = withTenant({ id: 'x' });

    expect(await service.resolveByCode(undefined)).toBeNull();
    expect(await service.resolveByCode('   ')).toBeNull();
    expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
  });
});
