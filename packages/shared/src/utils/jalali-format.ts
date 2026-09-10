/**
 * نمایش تاریخ و سال شمسی.
 *
 * از `jalali.ts` جدا شده: تبدیل تقویم (منطق) با نحوهٔ نمایشش (ظاهر) دو
 * مسئولیت متفاوت‌اند و هرکدام جداگانه تغییر می‌کنند.
 */

import { isoToJalali, JALALI_MONTHS } from './jalali.js';

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

/** «۱۴۰۵/۰۱/۱۶» */
export function formatJalali(iso: string): string {
  const { jy, jm, jd } = isoToJalali(iso);
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/** «۱۶ فروردین ۱۴۰۵» */
export function formatJalaliLong(iso: string): string {
  const { jy, jm, jd } = isoToJalali(iso);
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}

/** «شنبه، ۱۶ فروردین ۱۴۰۵» */
export function formatJalaliWithWeekday(iso: string): string {
  // روز هفته از تاریخ میلادی گرفته می‌شود چون `Date.getDay` مبنای
  // میلادی دارد؛ تبدیل جلالی فقط برای بخش نمایشی است.
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const weekday = PERSIAN_WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${weekday}، ${formatJalaliLong(iso)}`;
}

/** «14050116» — قالب فایل اکسل واقعی، برای خروجی صورتجلسه. */
export function formatJalaliCompact(iso: string): string {
  const { jy, jm, jd } = isoToJalali(iso);
  return `${jy}${pad(jm)}${pad(jd)}`;
}

export function getMonthName(month: number): string {
  return JALALI_MONTHS[month - 1] ?? '';
}

/**
 * نمایش سال شمسی با ارقام فارسی.
 *
 * جداکنندهٔ هزارگان عمداً خاموش است: سال یک **شناسه** است نه مقدار، و
 * «۱٬۴۰۵» غلط خوانده می‌شود.
 */
export function formatYear(year: number): string {
  return year.toLocaleString('fa-IR', { useGrouping: false });
}
