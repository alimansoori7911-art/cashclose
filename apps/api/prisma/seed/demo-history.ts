/**
 * ساخت تاریخچهٔ چندروزهٔ نمونه — ابزار توسعه.
 *
 * گزارش‌های مدیریتی بدون داده معنا ندارند: نمودار روند، مقایسهٔ شعبه و
 * پیش‌بینی ماه همه به چند هفته داده نیاز دارند. این اسکریپت صندوق‌های
 * تأییدشدهٔ واقع‌نما می‌سازد.
 *
 * اجرا: npm run db:demo-history --workspace @cashclose/api
 */

import { CashRegisterStatus, PrismaClient } from '@prisma/client';

import { buildAmounts } from './demo-amounts';

const prisma = new PrismaClient();

/** بازهٔ ساخت — تا دو روز پیش، چون امروز و دیروز دست صندوقدار است. */
const DAYS = 75;

async function loadContext() {
  const tenant = await prisma.tenant.findFirst({ select: { id: true } });
  if (!tenant) throw new Error('ابتدا دادهٔ نمونه را بسازید (npm run db:seed).');

  const branches = await prisma.branch.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, name: true },
    take: 2,
  });

  const cashiers = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: 'cashier' },
    select: { id: true, branchId: true },
  });

  if (branches.length === 0 || cashiers.length === 0) {
    throw new Error('شعبه یا صندوقدار یافت نشد.');
  }

  const accountant = await prisma.user.findFirst({
    where: { tenantId: tenant.id, role: 'accountant' },
    select: { id: true },
  });

  return { tenant, branches, cashiers, accountantId: accountant?.id ?? null };
}

type Context = Awaited<ReturnType<typeof loadContext>>;

async function createRegister(
  ctx: Context,
  branchId: string,
  cashierId: string,
  date: Date,
  dayOffset: number,
  scale: number,
) {
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

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('اجرای این اسکریپت در محیط تولید مجاز نیست.');
  }

  const ctx = await loadContext();
  let created = 0;

  for (let offset = DAYS; offset >= 2; offset--) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    date.setHours(0, 0, 0, 0);

    for (const branch of ctx.branches) {
      const cashier =
        ctx.cashiers.find((c) => c.branchId === branch.id) ?? ctx.cashiers[0];
      if (!cashier) continue;

      const exists = await prisma.cashRegister.findFirst({
        where: { branchId: branch.id, cashierId: cashier.id, businessDate: date },
        select: { id: true },
      });
      if (exists) continue;

      // شعبهٔ دوم کوچک‌تر است تا مقایسهٔ شعب معنا پیدا کند.
      const scale = branch.id === ctx.branches[0]?.id ? 1 : 0.65;
      await createRegister(ctx, branch.id, cashier.id, date, offset, scale);
      created += 1;
    }
  }

  /* eslint-disable no-console */
  console.log(`${created} صندوق تأییدشدهٔ نمونه ساخته شد.`);
  console.log(`بازه: ${DAYS} روز گذشته، ${ctx.branches.length} شعبه.`);
  /* eslint-enable no-console */
}

main()
  .catch((error) => {
    console.error('ساخت تاریخچه ناموفق بود:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
