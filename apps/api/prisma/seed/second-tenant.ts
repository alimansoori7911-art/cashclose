/**
 * ساخت مستأجر دوم — برای آزمودن جداسازی چندفروشگاهی.
 *
 * نام کاربری‌ها **عمداً** با مستأجر اول یکی‌اند (`cashier1`، `owner`، …)
 * چون نام کاربری فقط درون هر مجموعه یکتاست. این همان حالتی است که باید
 * ثابت کند سامانه دو مجموعه را قاطی نمی‌کند.
 *
 * اجرا: node dist/prisma/seed/second-tenant.js
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

import { DEMO_PASSWORD } from './data';

const prisma = new PrismaClient();

const TENANT = {
  id: 'c3f1b8e2-9d47-4a56-b1e0-7f2a5c8d3e94',
  name: 'فروشگاه دوم (آزمایشی)',
  /** زیردامنهٔ اختصاصی: `dovom.cashclose.ir` */
  slug: 'dovom',
};

const STORE = {
  id: 'd4a2c9f3-8e56-4b67-c2f1-8a3b6d9e4f05',
  name: 'فروشگاه دوم',
  address: 'اصفهان',
};

const BRANCH = {
  id: 'e5b3daf4-7f65-4c78-d3a2-9b4c7ea5f016',
  name: 'شعبهٔ مرکزی اصفهان',
};

const USERS = [
  { username: 'cashier1', fullName: 'نازنین قاسمی', role: UserRole.cashier, branch: true },
  { username: 'owner', fullName: 'مهدی صادقی', role: UserRole.owner, branch: false },
  { username: 'accountant', fullName: 'سارا نوری', role: UserRole.accountant, branch: false },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('اجرای این اسکریپت در محیط تولید مجاز نیست.');
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
  });

  await prisma.tenant.upsert({
    where: { id: TENANT.id },
    update: {},
    create: { id: TENANT.id, name: TENANT.name, slug: TENANT.slug },
  });

  await prisma.store.upsert({
    where: { id: STORE.id },
    update: {},
    create: { ...STORE, tenantId: TENANT.id },
  });

  await prisma.branch.upsert({
    where: { id: BRANCH.id },
    update: {},
    create: { ...BRANCH, tenantId: TENANT.id, storeId: STORE.id },
  });

  for (const user of USERS) {
    await prisma.user.upsert({
      where: {
        tenantId_username: { tenantId: TENANT.id, username: user.username },
      },
      update: {},
      create: {
        tenantId: TENANT.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        passwordHash,
        branchId: user.branch ? BRANCH.id : null,
      },
    });
  }

  await prisma.posTerminal.upsert({
    where: { id: 'f6c4eb05-6a74-4d89-e4b3-ac5d8fb6a127' },
    update: {},
    create: {
      id: 'f6c4eb05-6a74-4d89-e4b3-ac5d8fb6a127',
      tenantId: TENANT.id,
      branchId: BRANCH.id,
      name: 'کارتخوان اصفهان',
      bank: 'پاسارگاد',
    },
  });

  /* eslint-disable no-console */
  console.log('مستأجر دوم ساخته شد:');
  console.log(`  مجموعه: ${TENANT.name}`);
  console.log(`  شناسهٔ مجموعه: ${TENANT.id}`);
  console.log(`  شعبه: ${BRANCH.name}`);
  console.log(`  کاربران: ${USERS.map((u) => u.username).join('، ')}`);
  console.log(`  رمز: ${DEMO_PASSWORD}`);
  console.log('');
  console.log('توجه: نام کاربری‌ها با مستأجر اول یکی است. هنگام ورود،');
  console.log('سامانه باید شناسهٔ مجموعه را بخواهد — همین آزمون جداسازی است.');
  /* eslint-enable no-console */
}

main()
  .catch((error) => {
    console.error('ساخت مستأجر دوم ناموفق بود:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
