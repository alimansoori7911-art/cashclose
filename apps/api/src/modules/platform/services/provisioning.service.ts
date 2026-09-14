import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { PasswordService } from '../../auth/services/password.service';
import type { CreateTenantDto } from '../dto/create-tenant.dto';
import {
  generateBusinessCode,
  isReservedSlug,
  isValidSlug,
} from '../platform.rules';

/**
 * ساخت مجموعهٔ کسب‌وکار تازه.
 *
 * مجموعه، فروشگاه و حساب مالک در **یک تراکنش** ساخته می‌شوند: مجموعه‌ای
 * بدون مالک قابل ورود نیست و اگر نیمه‌کاره بماند، مدیر سامانه رکوردی
 * می‌بیند که نه کار می‌کند نه می‌شود دوباره ساختش.
 */
@Injectable()
export class ProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async create(adminId: string, dto: CreateTenantDto) {
    const slug = dto.slug.toLowerCase().trim();

    if (!isValidSlug(slug)) {
      throw new BadRequestException(
        'شناسهٔ آدرس فقط حروف کوچک لاتین، رقم و خط تیره؛ نباید با خط تیره شروع یا تمام شود.',
      );
    }

    if (isReservedSlug(slug)) {
      throw new BadRequestException('این شناسهٔ آدرس رزرو شده است.');
    }

    const duplicate = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException('این شناسهٔ آدرس قبلاً استفاده شده است.');
    }

    const passwordHash = await this.passwords.hash(dto.ownerPassword);
    const code = await this.uniqueCode();

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name.trim(),
          slug,
          code,
          createdById: adminId,
        },
        select: { id: true, name: true, slug: true, code: true },
      });

      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: dto.storeName?.trim() || dto.name.trim(),
        },
        select: { id: true, name: true },
      });

      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          fullName: dto.ownerFullName.trim(),
          username: dto.ownerUsername.trim(),
          passwordHash,
          role: UserRole.owner,
        },
        select: { id: true, username: true, fullName: true },
      });

      return { tenant, store, owner };
    });
  }

  /**
   * کد یکتا.
   *
   * برخورد با ۳۲^۸ حالت عملاً محال است، ولی «عملاً محال» با «محال» فرق
   * دارد و قید یکتایی دیتابیس خطای مبهم می‌داد.
   */
  private async uniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateBusinessCode();
      const taken = await this.prisma.tenant.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!taken) return code;
    }

    throw new BadRequestException(
      'ساخت کد یکتا ممکن نشد. دوباره تلاش کنید.',
    );
  }
}
