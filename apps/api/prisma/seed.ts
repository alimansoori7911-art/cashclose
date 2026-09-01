/**
 * دادهٔ نمونه برای توسعه.
 *
 * یک مستأجر با یک فروشگاه دوشعبه‌ای، کاربران هر ۵ نقش و چند کارتخوان
 * می‌سازد تا بتوان بلافاصله وارد سامانه شد و جریان‌ها را آزمود.
 *
 * اجرا: npm run db:seed
 * این اسکریپت idempotent است و اجرای دوباره داده را تکراری نمی‌کند.
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/** رمز مشترک کاربران نمونه — فقط برای محیط توسعه. */
const DEMO_PASSWORD = 'Cashclose@1404';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('اجرای seed در محیط تولید مجاز نیست.');
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'فروشگاه رهاوی',
    },
  });

  const store = await prisma.store.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      tenantId: tenant.id,
      name: 'فروشگاه رهاوی',
      address: 'تهران',
      phone: '02112345678',
    },
  });

  const branches = await Promise.all(
    [
      { id: '00000000-0000-0000-0000-000000000020', name: 'شعبهٔ ونک' },
      { id: '00000000-0000-0000-0000-000000000021', name: 'شعبهٔ تهران‌پارس' },
    ].map((branch) =>
      prisma.branch.upsert({
        where: { id: branch.id },
        update: {},
        create: {
          id: branch.id,
          tenantId: tenant.id,
          storeId: store.id,
          name: branch.name,
        },
      }),
    ),
  );

  const mainBranch = branches[0];
  if (!mainBranch) throw new Error('ساخت شعبه ناموفق بود.');

  const users: Array<{
    username: string;
    fullName: string;
    role: UserRole;
    branchId: string | null;
  }> = [
    {
      username: 'cashier1',
      fullName: 'علی احمدی',
      role: UserRole.cashier,
      branchId: mainBranch.id,
    },
    {
      username: 'cashier2',
      fullName: 'مریم رضایی',
      role: UserRole.cashier,
      branchId: mainBranch.id,
    },
    {
      username: 'accountant',
      fullName: 'حسین کریمی',
      role: UserRole.accountant,
      branchId: null,
    },
    {
      username: 'manager',
      fullName: 'زهرا موسوی',
      role: UserRole.store_manager,
      branchId: null,
    },
    {
      username: 'owner',
      fullName: 'رضا رهاوی',
      role: UserRole.owner,
      branchId: null,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        tenantId_username: { tenantId: tenant.id, username: user.username },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        branchId: user.branchId,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        passwordHash,
      },
    });
  }

  // کارتخوان‌ها — نام بانک‌ها از فایل اکسل واقعی گرفته شده است.
  const terminals = ['سامان', 'ملت', 'اقتصاد نوین', 'صادرات', 'آینده'];
  for (const [index, bank] of terminals.entries()) {
    const id = `00000000-0000-0000-0000-00000000003${index}`;
    await prisma.posTerminal.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tenantId: tenant.id,
        branchId: mainBranch.id,
        name: `کارتخوان ${index + 1}`,
        bank,
      },
    });
  }

  /* eslint-disable no-console */
  console.log('دادهٔ نمونه با موفقیت ساخته شد.');
  console.log(`  مستأجر: ${tenant.name}`);
  console.log(`  شعبه‌ها: ${branches.map((b) => b.name).join('، ')}`);
  console.log(`  کاربران: ${users.map((u) => u.username).join('، ')}`);
  console.log(`  رمز عبور همهٔ کاربران نمونه: ${DEMO_PASSWORD}`);
  /* eslint-enable no-console */
}

main()
  .catch((error) => {
    console.error('اجرای seed ناموفق بود:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
