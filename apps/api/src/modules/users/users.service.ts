import { ConflictException, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import type { RequestUser } from '../../common/tenant/request-user';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/services/password.service';
import type { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { USER_FIELDS, UsersQuery } from './users.query';
import {
  assertBranchMatchesRole,
  assertCanAssignRole,
  assertCanModifyTarget,
  assertNotSelfModification,
} from './users.rules';

/**
 * تغییر کاربران (ساخت، ویرایش، غیرفعال‌سازی).
 *
 * خواندن در `UsersQuery` و قواعد کسب‌وکاری در `users.rules.ts` است.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: UsersQuery,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
  ) {}

  async create(actor: RequestUser, dto: CreateUserDto) {
    assertCanAssignRole(actor, dto.role);
    assertBranchMatchesRole(dto.role, dto.branchId);

    if (dto.branchId) {
      await this.query.assertBranchInTenant(actor.tenantId, dto.branchId);
    }

    const duplicate = await this.prisma.user.findFirst({
      where: { tenantId: actor.tenantId, username: dto.username },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException('این نام کاربری قبلاً ثبت شده است.');
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId: actor.tenantId,
        fullName: dto.fullName,
        username: dto.username,
        role: dto.role,
        branchId: dto.branchId ?? null,
        passwordHash: await this.passwords.hash(dto.password),
      },
      select: USER_FIELDS,
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'user_created',
      entityType: 'user',
      entityId: user.id,
      meta: { username: user.username, role: user.role },
    });

    return user;
  }

  async update(actor: RequestUser, id: string, dto: UpdateUserDto) {
    const target = await this.query.findOne(actor.tenantId, id);

    assertNotSelfModification(actor, id, dto);
    assertCanModifyTarget(actor, target.role);
    if (dto.role) assertCanAssignRole(actor, dto.role);

    const nextRole = dto.role ?? target.role;
    const nextBranch =
      dto.branchId !== undefined ? dto.branchId : target.branchId;
    assertBranchMatchesRole(nextRole, nextBranch);

    if (dto.branchId) {
      await this.query.assertBranchInTenant(actor.tenantId, dto.branchId);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_FIELDS,
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'user_updated',
      entityType: 'user',
      entityId: id,
      meta: { changes: dto },
    });

    return user;
  }

  /** غیرفعال‌سازی به‌جای حذف — بند AC10 سند. */
  async deactivate(actor: RequestUser, id: string) {
    const target = await this.query.findOne(actor.tenantId, id);

    assertNotSelfModification(actor, id, { status: UserStatus.inactive });
    assertCanModifyTarget(actor, target.role);

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.inactive },
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'user_deactivated',
      entityType: 'user',
      entityId: id,
      meta: { username: target.username },
    });

    return { message: 'کاربر غیرفعال شد.' };
  }
}
