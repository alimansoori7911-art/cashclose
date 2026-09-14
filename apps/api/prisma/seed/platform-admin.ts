/**
 * ساخت حساب مدیر سامانه — ابزار راه‌اندازی.
 *
 * این حساب بیرون از همهٔ مجموعه‌هاست و فقط کسب‌وکار می‌سازد. عمداً از
 * طریق API قابل ساخت نیست: اگر مسیری برای ساختش وجود داشت، همان مسیر
 * راهی برای ساختن مدیر سامانهٔ تازه توسط مهاجم می‌شد.
 *
 * اجرا:
 *   npm run db:platform-admin --workspace @cashclose/api -- <username> <password>
 */

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const [username, password, fullName] = process.argv.slice(2);

  if (!username || !password) {
    throw new Error(
      'استفاده: npm run db:platform-admin -- <نام‌کاربری> <رمز> [نام کامل]',
    );
  }

  if (password.length < 12) {
    // سخت‌گیرانه‌تر از کاربران عادی: این حساب به ساخت همهٔ مشتری‌ها
    // دسترسی دارد.
    throw new Error('رمز مدیر سامانه حداقل ۱۲ نویسه باشد.');
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.platformAdmin.upsert({
    where: { username },
    update: { passwordHash, isActive: true },
    create: {
      username,
      passwordHash,
      fullName: fullName || username,
    },
    select: { id: true, username: true, fullName: true },
  });

  /* eslint-disable no-console */
  console.log('حساب مدیر سامانه آماده است:');
  console.log(`  نام کاربری: ${admin.username}`);
  console.log(`  نام: ${admin.fullName}`);
  console.log('\nورود از مسیر /platform در وب‌اپ.');
  /* eslint-enable no-console */
}

main()
  .catch((error) => {
    console.error('ساخت حساب ناموفق بود:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
