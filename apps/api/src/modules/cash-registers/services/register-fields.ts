import type { Prisma } from '@prisma/client';

/**
 * انتخاب فیلدهای صندوق برای کوئری‌ها.
 *
 * جدا نگه داشته شده تا هر جای دیگری که صندوق می‌خواند از همین شکل
 * استفاده کند و پاسخ‌ها ناهماهنگ نشوند.
 *
 * نوع صریح `Prisma.CashRegisterSelect` لازم است: بدون آن `'asc'` به
 * `string` تعمیم می‌یابد، و با `as const` آرایهٔ `orderBy` تغییرناپذیر
 * می‌شود — Prisma هیچ‌کدام را نمی‌پذیرد.
 */

/** فیلدهای خلاصه — برای فهرست‌ها. */
export const REGISTER_SUMMARY_FIELDS = {
  id: true,
  businessDate: true,
  coversUntilDate: true,
  status: true,
  registerBalance: true,
  documentsTotal: true,
  difference: true,
  submittedAt: true,
  createdAt: true,
  branch: { select: { id: true, name: true } },
  cashier: { select: { id: true, fullName: true } },
} as const;

/**
 * فیلدهای کامل — برای صفحهٔ جزئیات.
 *
 * برخلاف فیلدهای خلاصه، اینجا `as const` استفاده نمی‌شود: آرایهٔ
 * `orderBy` را readonly می‌کند و Prisma فقط آرایهٔ قابل‌تغییر می‌پذیرد.
 */
export const REGISTER_DETAIL_FIELDS: Prisma.CashRegisterSelect = {
  ...REGISTER_SUMMARY_FIELDS,
  finalNotes: true,
  approvedAt: true,
  rejectedAt: true,
  cashierId: true,
  transactions: {
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      terminalId: true,
      sortOrder: true,
      terminal: { select: { id: true, name: true, bank: true } },
      uploads: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
  },
  history: {
    select: {
      id: true,
      status: true,
      comment: true,
      createdAt: true,
      createdBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
};
