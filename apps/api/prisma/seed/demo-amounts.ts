/**
 * تولید ارقام صندوق نمونه.
 *
 * جدا از اسکریپت درج، چون منطق «چه عددی» با منطق «چطور در پایگاه داده
 * بنویس» یکی نیست و این‌طور هرکدام مستقل خوانده و تغییر داده می‌شود.
 */

import { TransactionType } from '@prisma/client';

/** واحد گرد کردن — فروشگاه واقعی رقم خردتر از این ثبت نمی‌کند. */
const ROUND_TO = 100_000;

function roundToUnit(value: number): number {
  return Math.round(value / ROUND_TO) * ROUND_TO;
}

/** فروش روزانه با نوسان طبیعی: آخر هفته شلوغ‌تر است. */
export function dailySales(dayOffset: number, date: Date): number {
  const weekday = date.getDay();
  // پنج‌شنبه و جمعه پرفروش‌ترند.
  const weekendBoost = weekday === 4 || weekday === 5 ? 1.4 : 1;
  const drift = 1 + (dayOffset % 7) * 0.03;
  const noise = 0.85 + ((dayOffset * 37) % 30) / 100;

  return roundToUnit(12_000_000 * weekendBoost * drift * noise);
}

export interface RegisterAmounts {
  balance: number;
  rows: { type: TransactionType; amount: number }[];
}

/**
 * اقلام یک صندوق روزانه.
 *
 * تقسیم بین نقدی و کارتخوان طوری است که جمع اسناد **دقیقاً** برابر مانده
 * شود: قاعدهٔ «اختلاف صفر» سند اجازهٔ گرد کردن در این مرحله را نمی‌دهد.
 */
export function buildAmounts(
  dayOffset: number,
  date: Date,
  scale: number,
): RegisterAmounts {
  const sales = roundToUnit(dailySales(dayOffset, date) * scale);
  const goodsReturn = roundToUnit(sales * 0.05);
  const balance = sales - goodsReturn;

  const cash = roundToUnit(balance * 0.4);
  const pos = balance - cash;

  const rows: { type: TransactionType; amount: number }[] = [
    { type: TransactionType.sales_total, amount: sales },
    { type: TransactionType.goods_return, amount: goodsReturn },
    { type: TransactionType.cash, amount: cash },
    { type: TransactionType.pos, amount: pos },
  ];

  // هر چند روز یک خرید بدون تسویه، تا گزارش مربوطه داده داشته باشد.
  // مازاد هم‌اندازه ثبت می‌شود تا اختلاف صفر بماند.
  if (dayOffset % 11 === 0) {
    const debt = 2_000_000;
    rows.push({ type: TransactionType.unsettled_purchase, amount: debt });
    rows.push({ type: TransactionType.cash_surplus, amount: debt });
  }

  return { balance, rows };
}
