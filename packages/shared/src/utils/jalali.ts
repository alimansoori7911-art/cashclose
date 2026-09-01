/**
 * تاریخ جلالی (شمسی).
 *
 * قاعدهٔ سیستم: تاریخ‌ها همیشه به‌صورت ISO (`YYYY-MM-DD` میلادی) ذخیره و
 * جابه‌جا می‌شوند و تبدیل به شمسی فقط در لایهٔ نمایش انجام می‌شود. این
 * فایل مرز بین آن دو است.
 *
 * فایل اکسل واقعی تاریخ را به‌صورت `14050116` (بدون جداکننده) می‌نویسد؛
 * `formatJalaliCompact` همان قالب را برای خروجی صورتجلسه تولید می‌کند.
 */

import * as jalaali from 'jalaali-js';

export interface JalaliDate {
  readonly jy: number;
  readonly jm: number;
  readonly jd: number;
}

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
] as const;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/**
 * تجزیهٔ `YYYY-MM-DD` با اعتبارسنجی.
 * تنها نقطهٔ ورود تاریخ ISO به این ماژول است تا قالب نامعتبر زودهنگام
 * و با پیام روشن رد شود.
 */
function parseIso(iso: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`تاریخ ISO نامعتبر است: ${iso}`);
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`تاریخ ISO نامعتبر است: ${iso}`);
  }
  return { y, m, d };
}

/** `YYYY-MM-DD` میلادی → تاریخ جلالی. */
export function isoToJalali(iso: string): JalaliDate {
  const { y, m, d } = parseIso(iso);
  return jalaali.toJalaali(y, m, d);
}

/** تاریخ جلالی → `YYYY-MM-DD` میلادی. */
export function jalaliToIso(date: JalaliDate): string {
  const g = jalaali.toGregorian(date.jy, date.jm, date.jd);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** `Date` → `YYYY-MM-DD` بر اساس وقت محلی (نه UTC، تا روز جابه‌جا نشود). */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** تاریخ امروز به‌صورت ISO. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** جابه‌جایی روز روی تاریخ ISO؛ `addDaysIso(today, -1)` یعنی دیروز. */
export function addDaysIso(iso: string, days: number): string {
  const { y, m, d } = parseIso(iso);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** «۱۴۰۵/۰۱/۱۶» */
export function formatJalali(iso: string): string {
  const { jy, jm, jd } = isoToJalali(iso);
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/** «۱۶ فروردین ۱۴۰۵» */
export function formatJalaliLong(iso: string): string {
  const { jy, jm, jd } = isoToJalali(iso);
  return `${jd} ${PERSIAN_MONTHS[jm - 1]} ${jy}`;
}

/** «شنبه، ۱۶ فروردین ۱۴۰۵» */
export function formatJalaliWithWeekday(iso: string): string {
  const { y, m, d } = parseIso(iso);
  const weekday = PERSIAN_WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${weekday}، ${formatJalaliLong(iso)}`;
}

/** «14050116» — قالب فایل اکسل واقعی، برای خروجی صورتجلسه. */
export function formatJalaliCompact(iso: string): string {
  const { jy, jm, jd } = isoToJalali(iso);
  return `${jy}${pad(jm)}${pad(jd)}`;
}

export function getMonthName(month: number): string {
  return PERSIAN_MONTHS[month - 1] ?? '';
}

export const JALALI_MONTHS = PERSIAN_MONTHS;

/** تعداد روزهای یک ماه شمسی — برای پیش‌بینی فروش ماهانه. */
export function jalaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

/** اولین و آخرین روز ماه شمسی، به‌صورت ISO — برای فیلترهای بازه‌ای. */
export function jalaliMonthRange(
  jy: number,
  jm: number,
): { from: string; to: string } {
  return {
    from: jalaliToIso({ jy, jm, jd: 1 }),
    to: jalaliToIso({ jy, jm, jd: jalaliMonthLength(jy, jm) }),
  };
}
