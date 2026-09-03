import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CreatePosTerminalDto,
  UpdatePosTerminalDto,
} from './dto/pos-terminal.dto';
import { TERMINAL_FIELDS, PosTerminalsQuery } from './pos-terminals.query';

/** تغییر کارتخوان‌ها. */
@Injectable()
export class PosTerminalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: PosTerminalsQuery,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreatePosTerminalDto,
  ) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
      select: { id: true, isActive: true },
    });

    if (!branch) throw new NotFoundException('شعبه یافت نشد.');
    if (!branch.isActive) {
      throw new BadRequestException(
        'برای شعبهٔ غیرفعال نمی‌توان کارتخوان تعریف کرد.',
      );
    }

    const terminal = await this.prisma.posTerminal.create({
      data: { ...dto, tenantId },
      select: TERMINAL_FIELDS,
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'pos_terminal_created',
      entityType: 'pos_terminal',
      entityId: terminal.id,
      meta: { name: terminal.name, bank: terminal.bank },
    });

    return terminal;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdatePosTerminalDto,
  ) {
    const terminal = await this.query.findOne(tenantId, id);

    if (dto.assignedToId) {
      await this.assertAssigneeValid(tenantId, terminal.branchId, dto.assignedToId);
    }

    const updated = await this.prisma.posTerminal.update({
      where: { id },
      data: dto,
      select: TERMINAL_FIELDS,
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'pos_terminal_updated',
      entityType: 'pos_terminal',
      entityId: id,
      meta: { changes: dto },
    });

    return updated;
  }

  async deactivate(tenantId: string, userId: string, id: string) {
    const terminal = await this.query.findOne(tenantId, id);

    await this.prisma.posTerminal.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.record({
      tenantId,
      userId,
      action: 'pos_terminal_deactivated',
      entityType: 'pos_terminal',
      entityId: id,
      meta: { name: terminal.name },
    });

    return { message: 'کارتخوان غیرفعال شد.' };
  }

  /**
   * مسئول دستگاه باید صندوقدارِ همان شعبه باشد.
   *
   * بدون این بررسی، می‌شد دستگاهی را به صندوقدار شعبهٔ دیگر یا حتی به
   * یک نقش ستادی نسبت داد.
   */
  private async assertAssigneeValid(
    tenantId: string,
    branchId: string,
    assigneeId: string,
  ) {
    const assignee = await this.prisma.user.findFirst({
      where: { id: assigneeId, tenantId },
      select: { role: true, branchId: true },
    });

    if (!assignee) throw new NotFoundException('کاربر یافت نشد.');

    if (assignee.role !== UserRole.cashier) {
      throw new BadRequestException(
        'کارتخوان تنها به صندوقدار قابل تخصیص است.',
      );
    }

    if (assignee.branchId !== branchId) {
      throw new BadRequestException(
        'صندوقدار انتخاب‌شده به این شعبه تعلق ندارد.',
      );
    }
  }
}
