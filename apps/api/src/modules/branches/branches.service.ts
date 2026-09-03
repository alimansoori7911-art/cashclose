import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BRANCH_FIELDS, BranchesQuery } from './branches.query';
import type { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

/** تغییر شعبه‌ها. خواندن در `BranchesQuery` است. */
@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: BranchesQuery,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateBranchDto) {
    // فروشگاه باید متعلق به همین مستأجر باشد، وگرنه می‌شد با فرستادن
    // شناسهٔ فروشگاهِ مستأجر دیگر، شعبه‌ای زیر آن ساخت.
    const store = await this.prisma.store.findFirst({
      where: { id: dto.storeId, tenantId },
      select: { id: true, isActive: true },
    });

    if (!store) throw new NotFoundException('فروشگاه یافت نشد.');
    if (!store.isActive) {
      throw new BadRequestException(
        'برای فروشگاه غیرفعال نمی‌توان شعبهٔ جدید ساخت.',
      );
    }

    const branch = await this.prisma.branch.create({
      data: { ...dto, tenantId },
      select: BRANCH_FIELDS,
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'branch_created',
      entityType: 'branch',
      entityId: branch.id,
      meta: { name: branch.name, storeId: dto.storeId },
    });

    return branch;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateBranchDto,
  ) {
    await this.query.findOne(tenantId, id);

    const branch = await this.prisma.branch.update({
      where: { id },
      data: dto,
      select: BRANCH_FIELDS,
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'branch_updated',
      entityType: 'branch',
      entityId: id,
      meta: { changes: dto },
    });

    return branch;
  }

  async deactivate(tenantId: string, userId: string, id: string) {
    const branch = await this.query.findOne(tenantId, id);

    // صندوق باز یعنی کار ناتمام؛ غیرفعال‌کردن شعبه آن را بلاتکلیف
    // می‌گذارد.
    const openRegisters = await this.prisma.cashRegister.count({
      where: {
        branchId: id,
        status: { in: ['draft', 'submitted', 'rejected'] },
      },
    });

    if (openRegisters > 0) {
      throw new BadRequestException(
        `این شعبه ${openRegisters} صندوق باز دارد. ابتدا آن‌ها را تعیین تکلیف کنید.`,
      );
    }

    await this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'branch_deactivated',
      entityType: 'branch',
      entityId: id,
      meta: { name: branch.name },
    });

    return { message: 'شعبه غیرفعال شد.' };
  }
}
