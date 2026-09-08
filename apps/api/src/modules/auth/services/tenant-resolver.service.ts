import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * تشخیص مجموعه از روی آدرس درخواست.
 *
 * هر مشتری زیردامنهٔ خودش را دارد (`refah.cashclose.ir`) و کاربر هیچ‌گاه
 * شناسه‌ای تایپ نمی‌کند. فهرست‌کردن مجموعه‌ها در فرم ورود عمداً پیاده
 * نشده: نام مشتریان یک اطلاعات تجاری است و نباید در دسترس عموم باشد.
 */
@Injectable()
export class TenantResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * استخراج زیردامنه از نام میزبان.
   *
   * `refah.cashclose.ir` → `refah`
   * `cashclose.ir`       → null (دامنهٔ اصلی، مجموعه‌ای ندارد)
   * `localhost:5173`     → null (توسعه)
   * `2.144.26.1`         → null (آی‌پی خام)
   */
  extractSlug(host: string | undefined): string | null {
    if (!host) return null;

    // پورت و حروف بزرگ حذف می‌شوند تا مقایسه پایدار بماند.
    const hostname = host.split(':')[0]?.toLowerCase().trim();
    if (!hostname) return null;

    // آی‌پی خام زیردامنه ندارد.
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;

    const parts = hostname.split('.');

    // کمتر از سه بخش یعنی دامنهٔ اصلی است، نه زیردامنهٔ مشتری.
    if (parts.length < 3) return null;

    const slug = parts[0];
    if (!slug || RESERVED.has(slug)) return null;

    return slug;
  }

  /** مجموعهٔ متناظر با زیردامنه؛ `null` یعنی زیردامنه ناشناخته است. */
  async findBySlug(slug: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });
  }

  /**
   * شناسهٔ مجموعه از روی میزبان درخواست.
   *
   * نتیجهٔ `null` یعنی «از آدرس مشخص نشد» — در آن حالت منطق ورود به
   * روش قبلی برمی‌گردد و اگر نام کاربری مبهم بود، ردش می‌کند.
   */
  async resolveTenantId(host: string | undefined): Promise<string | null> {
    const slug = this.extractSlug(host);
    if (!slug) return null;

    const tenant = await this.findBySlug(slug);
    return tenant?.id ?? null;
  }
}

/**
 * زیردامنه‌هایی که هرگز نباید به مشتری داده شوند.
 *
 * اگر مشتری `api` را بردارد، آدرس سرویس با آدرس او تداخل پیدا می‌کند.
 */
export const RESERVED = new Set([
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'static',
  'assets',
  'cdn',
  'status',
  'docs',
  'help',
  'support',
  'billing',
]);
