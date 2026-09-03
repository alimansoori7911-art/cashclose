import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';

export interface LoginCandidate {
  id: string;
  tenantId: string;
  username: string;
  fullName: string;
  role: UserRole;
  branchId: string | null;
  status: UserStatus;
  passwordHash: string;
  tenant: { status: string };
}

/**
 * یافتن کاربر هنگام ورود.
 *
 * نام کاربری فقط **درون** هر مستأجر یکتاست، پس جست‌وجو با نام کاربری
 * تنها می‌تواند چند نتیجه بدهد. انتخاب خودسرانهٔ یکی از آن‌ها کاربر را
 * به مجموعهٔ اشتباه می‌برد — بنابراین در صورت ابهام، ورود رد می‌شود و
 * از کاربر خواسته می‌شود مجموعه‌اش را مشخص کند.
 */
@Injectable()
export class LoginLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async findForLogin(
    username: string,
    tenantId?: string,
  ): Promise<LoginCandidate | null> {
    const candidates = await this.prisma.user.findMany({
      where: { username, ...(tenantId ? { tenantId } : {}) },
      select: {
        id: true,
        tenantId: true,
        username: true,
        fullName: true,
        role: true,
        branchId: true,
        status: true,
        passwordHash: true,
        tenant: { select: { status: true } },
      },
      // سقف کوچک: بیش از این تعداد یعنی نام کاربری واقعاً مبهم است.
      take: 5,
    });

    if (candidates.length > 1) {
      throw new UnauthorizedException(
        'این نام کاربری در چند مجموعه ثبت شده است. برای ورود، مجموعهٔ خود را مشخص کنید.',
      );
    }

    return candidates[0] ?? null;
  }
}
