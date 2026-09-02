/**
 * ساخت دادهٔ نمونه برای توسعه.
 *
 * اجرا: npm run db:seed
 * idempotent است — اجرای دوباره داده را تکراری نمی‌کند.
 */

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

import {
  BRANCHES,
  DEMO_PASSWORD,
  STORE,
  TENANT,
  TERMINAL_BANKS,
  USERS,
} from './data';

const prisma = new PrismaClient();

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('اجرای seed در محیط تولید مجاز نیست.');
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT.id },
    update: {},
    create: { id: TENANT.id, name: TENANT.name },
  });

  await prisma.store.upsert({
    where: { id: STORE.id },
    update: {},
    create: { ...STORE, tenantId: tenant.id },
  });

  const branches = await Promise.all(
    BRANCHES.map((branch) =>
      prisma.branch.upsert({
        where: { id: branch.id },
        update: {},
        create: {
          id: branch.id,
          name: branch.name,
          tenantId: tenant.id,
          storeId: STORE.id,
        },
      }),
    ),
  );

  const mainBranch = branches[0];
  if (!mainBranch) throw new Error('ساخت شعبه ناموفق بود.');

  for (const user of USERS) {
    await prisma.user.upsert({
      where: {
        tenantId_username: { tenantId: tenant.id, username: user.username },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        branchId: user.attachToBranch ? mainBranch.id : null,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        passwordHash,
      },
    });
  }

  for (const [index, bank] of TERMINAL_BANKS.entries()) {
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
  console.log('دادهٔ نمونه ساخته شد.');
  console.log(`  شعبه‌ها: ${branches.map((b) => b.name).join('، ')}`);
  console.log(`  کاربران: ${USERS.map((u) => u.username).join('، ')}`);
  console.log(`  رمز عبور همه: ${DEMO_PASSWORD}`);
  /* eslint-enable no-console */
}

seed()
  .catch((error) => {
    console.error('اجرای seed ناموفق بود:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
