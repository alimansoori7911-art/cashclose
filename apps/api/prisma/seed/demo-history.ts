/**
 * ساخت تاریخچهٔ چندروزهٔ نمونه — ابزار توسعه.
 *
 * گزارش‌های مدیریتی بدون داده معنا ندارند: نمودار روند، مقایسهٔ شعبه و
 * پیش‌بینی ماه همه به چند هفته داده نیاز دارند. این اسکریپت صندوق‌های
 * تأییدشدهٔ واقع‌نما می‌سازد.
 *
 * اجرا: npm run db:demo-history --workspace @cashclose/api
 * با دادهٔ سال گذشته: همان دستور + ` -- --with-last-year`
 */

import { PrismaClient } from '@prisma/client';

import { createRegister, type SeedContext } from './demo-register';

const prisma = new PrismaClient();

/** بازهٔ ساخت — تا دو روز پیش، چون امروز و دیروز دست صندوقدار است. */
const DAYS = 75;

/**
 * بازهٔ سال گذشته، برای آزمودن مقایسهٔ نظیربه‌نظیر (بند ۸ سمت مالک).
 *
 * با `--with-last-year` فعال می‌شود. حجم داده را چند برابر می‌کند، پس
 * پیش‌فرض خاموش است و فقط وقتی لازم است ساخته می‌شود.
 */
const LAST_YEAR_START = 440;
const LAST_YEAR_END = 370;

async function loadContext(): Promise<SeedContext> {
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

/** ساخت صندوق برای یک بازهٔ روز، با ضریب حجم دلخواه. */
async function fillRange(
  ctx: SeedContext,
  from: number,
  to: number,
  yearScale: number,
): Promise<number> {
  let created = 0;

  for (let offset = from; offset >= to; offset--) {
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
      const branchScale = branch.id === ctx.branches[0]?.id ? 1 : 0.65;
      await createRegister(
        prisma,
        ctx,
        branch.id,
        cashier.id,
        date,
        offset,
        branchScale * yearScale,
      );
      created += 1;
    }
  }

  return created;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('اجرای این اسکریپت در محیط تولید مجاز نیست.');
  }

  const ctx = await loadContext();
  const withLastYear = process.argv.includes('--with-last-year');

  let created = await fillRange(ctx, DAYS, 2, 1);

  if (withLastYear) {
    // ضریب ۰٫۸: سال گذشته کمتر فروخته تا نمودار مقایسه رشد نشان دهد،
    // نه دو ستون هم‌قد که چیزی از آن فهمیده نمی‌شود.
    created += await fillRange(ctx, LAST_YEAR_START, LAST_YEAR_END, 0.8);
  }

  /* eslint-disable no-console */
  console.log(`${created} صندوق تأییدشدهٔ نمونه ساخته شد.`);
  console.log(`بازه: ${DAYS} روز گذشته، ${ctx.branches.length} شعبه.`);
  if (withLastYear) {
    console.log('بازهٔ سال گذشته هم ساخته شد (برای مقایسهٔ نظیربه‌نظیر).');
  }
  /* eslint-enable no-console */
}

main()
  .catch((error) => {
    console.error('ساخت تاریخچه ناموفق بود:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
