import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { STORE_FIELDS, StoresQuery } from './stores.query';

/** تغییر فروشگاه‌ها. خواندن در `StoresQuery` است. */
@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: StoresQuery,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateStoreDto) {
    const store = await this.prisma.store.create({
      data: { ...dto, tenantId },
      select: STORE_FIELDS,
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'store_created',
      entityType: 'store',
      entityId: store.id,
      meta: { name: store.name },
    });

    return store;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateStoreDto,
  ) {
    // وجود رکورد در همین مستأجر پیش از به‌روزرسانی بررسی می‌شود تا
    // `update` نتواند رکورد مستأجر دیگری را لمس کند.
    await this.query.findOne(tenantId, id);

    const store = await this.prisma.store.update({
      where: { id },
      data: dto,
      select: STORE_FIELDS,
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'store_updated',
      entityType: 'store',
      entityId: id,
      meta: { changes: dto },
    });

    return store;
  }

  /**
   * غیرفعال‌سازی به‌جای حذف (بند AC10 سند). حذف واقعی، صندوق‌های
   * تاریخی را بی‌مرجع می‌کرد.
   */
  async deactivate(tenantId: string, userId: string, id: string) {
    const store = await this.query.findOne(tenantId, id);

    const activeBranches = await this.prisma.branch.count({
      where: { storeId: id, isActive: true },
    });

    if (activeBranches > 0) {
      throw new BadRequestException(
        `این فروشگاه ${activeBranches} شعبهٔ فعال دارد. ابتدا شعبه‌ها را غیرفعال کنید.`,
      );
    }

    await this.prisma.store.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'store_deactivated',
      entityType: 'store',
      entityId: id,
      meta: { name: store.name },
    });

    return { message: 'فروشگاه غیرفعال شد.' };
  }
}
