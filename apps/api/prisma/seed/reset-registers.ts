/**
 * پاک‌کردن صندوق‌های ثبت‌شده — ابزار توسعه.
 *
 * هنگام آزمودن دستی، صندوق در وضعیت `submitted` قفل می‌شود و ادامهٔ
 * کار روی آن ممکن نیست. این اسکریپت وضعیت را به نقطهٔ صفر برمی‌گرداند.
 *
 * اجرا: npm run db:reset-registers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('اجرای این اسکریپت در محیط تولید مجاز نیست.');
  }

  // ترتیب مهم است: تصویر، نسخه و تاریخچه به صندوق ارجاع دارند.
  const uploads = await prisma.upload.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.cashRegisterVersion.deleteMany({});
  await prisma.cashRegisterHistory.deleteMany({});
  const registers = await prisma.cashRegister.deleteMany({});

  /* eslint-disable no-console */
  console.log(`${registers.count} صندوق و ${uploads.count} تصویر پاک شد.`);
  console.log(
    'توجه: فایل‌های روی دیسک در پوشهٔ uploads/ دست‌نخورده می‌مانند.',
  );
  /* eslint-enable no-console */
}

main()
  .catch((error) => {
    console.error('پاک‌سازی ناموفق بود:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
