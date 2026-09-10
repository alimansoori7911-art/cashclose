/**
 * ساخت یک صندوق تأییدشدهٔ نمونه، با تراکنش‌ها و تاریخچه‌اش.
 *
 * از اسکریپت اصلی جدا شده: «چه صندوقی بساز» با «کدام روزها را پر کن»
 * دو مسئولیت متفاوت‌اند.
 */

import { CashRegisterStatus, type PrismaClient } from '@prisma/client';

import { buildAmounts } from './demo-amounts';

export interface SeedContext {
  tenant: { id: string };
  branches: { id: string; name: string }[];
  cashiers: { id: string; branchId: string | null }[];
  accountantId: string | null;
}

export async function createRegister(
  prisma: PrismaClient,
  ctx: SeedContext,
  branchId: string,
  cashierId: string,
  date: Date,
  dayOffset: number,
  scale: number,
): Promise<void> {
  const { balance, rows } = buildAmounts(dayOffset, date, scale);

  const register = await prisma.cashRegister.create({
    data: {
      tenantId: ctx.tenant.id,
      branchId,
      cashierId,
      businessDate: date,
      status: CashRegisterStatus.approved,
      registerBalance: BigInt(balance),
      documentsTotal: BigInt(balance),
      difference: 0n,
      submittedAt: date,
      approvedAt: date,
    },
    select: { id: true },
  });

  await prisma.transaction.createMany({
    data: rows.map((row, index) => ({
      tenantId: ctx.tenant.id,
      cashRegisterId: register.id,
      type: row.type,
      amount: BigInt(row.amount),
      sortOrder: index,
    })),
  });

  await prisma.cashRegisterHistory.createMany({
    data: [
      {
        tenantId: ctx.tenant.id,
        cashRegisterId: register.id,
        status: CashRegisterStatus.submitted,
        createdById: cashierId,
      },
      {
        tenantId: ctx.tenant.id,
        cashRegisterId: register.id,
        status: CashRegisterStatus.approved,
        createdById: ctx.accountantId,
      },
    ],
  });
}
