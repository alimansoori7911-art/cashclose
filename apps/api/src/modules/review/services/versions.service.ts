import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { diffVersions, type VersionPayload } from './version-diff';

/** نسخه‌های ثبت‌شدهٔ صندوق و مقایسهٔ آن‌ها. */
@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** فهرست نسخه‌ها — بدون payload تا پاسخ سبک بماند. */
  async list(tenantId: string, cashRegisterId: string) {
    await this.assertRegisterExists(tenantId, cashRegisterId);

    return this.prisma.cashRegisterVersion.findMany({
      where: { cashRegisterId, tenantId },
      select: {
        id: true,
        versionNumber: true,
        submittedAt: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * مقایسهٔ دو نسخه.
   *
   * اگر شماره‌ای داده نشود، دو نسخهٔ آخر مقایسه می‌شوند — همان چیزی که
   * حسابدار در عمل می‌خواهد: «صندوقدار پس از رد من چه چیزی را عوض کرد؟»
   */
  async compare(
    tenantId: string,
    cashRegisterId: string,
    fromVersion?: number,
    toVersion?: number,
  ) {
    await this.assertRegisterExists(tenantId, cashRegisterId);

    const versions = await this.prisma.cashRegisterVersion.findMany({
      where: { cashRegisterId, tenantId },
      select: {
        versionNumber: true,
        payload: true,
        submittedAt: true,
        createdBy: { select: { fullName: true } },
      },
      orderBy: { versionNumber: 'asc' },
    });

    if (versions.length < 2) {
      throw new BadRequestException(
        'برای مقایسه حداقل به دو نسخه نیاز است. این صندوق تنها یک‌بار ارسال شده است.',
      );
    }

    const target = toVersion ?? versions[versions.length - 1]!.versionNumber;
    const source = fromVersion ?? versions[versions.length - 2]!.versionNumber;

    const before = versions.find((v) => v.versionNumber === source);
    const after = versions.find((v) => v.versionNumber === target);

    if (!before || !after) {
      throw new NotFoundException('نسخهٔ مورد نظر یافت نشد.');
    }

    return {
      from: {
        versionNumber: before.versionNumber,
        submittedAt: before.submittedAt,
        submittedBy: before.createdBy?.fullName ?? null,
      },
      to: {
        versionNumber: after.versionNumber,
        submittedAt: after.submittedAt,
        submittedBy: after.createdBy?.fullName ?? null,
      },
      diff: diffVersions(
        before.payload as unknown as VersionPayload,
        after.payload as unknown as VersionPayload,
      ),
    };
  }

  private async assertRegisterExists(tenantId: string, id: string) {
    const exists = await this.prisma.cashRegister.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!exists) throw new NotFoundException('صندوق یافت نشد.');
  }
}
