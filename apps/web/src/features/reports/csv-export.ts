import { formatJalali } from '@cashclose/shared';

import type { BranchSales, DailySales } from './hooks/useReports';

/**
 * خروجی اکسل (بند AC11 سند).
 *
 * از CSV استفاده می‌شود نه xlsx: اکسل آن را مستقیم باز می‌کند و
 * وابستگی سنگین لازم نیست.
 *
 * دو نکتهٔ مهم برای اکسل فارسی:
 *  ۱. BOM در ابتدای فایل، وگرنه اکسل ویندوز متن فارسی را خراب نشان
 *     می‌دهد.
 *  ۲. اعداد با ارقام لاتین و بدون جداکننده، وگرنه اکسل آن‌ها را متن
 *     می‌بیند و جمع‌بستن ممکن نیست.
 */

const BOM = '﻿';

function escapeCell(value: string | number): string {
  const text = String(value);

  // فیلدی که کاما، نقل‌قول یا خط جدید دارد باید در نقل‌قول بیاید.
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  // پایان خط ویندوزی برای سازگاری بهتر با اکسل.
  return BOM + lines.join('\r\n');
}

/** دانلود محتوا به‌عنوان فایل. */
function download(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // آزادکردن حافظه پس از شروع دانلود.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportDailySales(data: DailySales[], suffix = ''): void {
  const csv = toCsv(
    ['تاریخ', 'فروش (ریال)', 'مانده صندوق', 'اختلاف', 'تعداد صندوق'],
    data.map((item) => [
      formatJalali(item.date),
      item.sales,
      item.registerBalance,
      item.difference,
      item.registerCount,
    ]),
  );

  download(csv, `فروش-روزانه${suffix}.csv`);
}

export function exportBranchComparison(data: BranchSales[]): void {
  const csv = toCsv(
    ['شعبه', 'فروش (ریال)', 'اختلاف', 'تعداد صندوق'],
    data.map((item) => [
      item.branchName,
      item.sales,
      item.difference,
      item.registerCount,
    ]),
  );

  download(csv, 'مقایسه-شعب.csv');
}
