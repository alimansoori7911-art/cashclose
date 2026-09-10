import { CashRegisterStatus, UserRole } from '@prisma/client';

import type { RequestUser } from '../../../common/tenant/request-user';

/**
 * ساخت شرط کوئری فهرست صندوق‌ها.
 *
 * جدا نگه داشته شده تا هم فهرست معمولی و هم نمای جدولی دقیقاً یک تعریف
 * از «صندوق قابل دیدن» داشته باشند و از هم واگرا نشوند.
 */

export interface RegisterFilters {
  status?: CashRegisterStatus;
  branchId?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  onlyWithDiscrepancy?: boolean;
}

/** اقلامی که وجودشان یعنی صندوق با مازاد یا کسری بسته شده است. */
const DISCREPANCY_TYPES = ['cash_surplus', 'cash_shortage'] as const;

export function buildRegisterWhere(
  actor: RequestUser,
  filters: RegisterFilters,
) {
  return {
    tenantId: actor.tenantId,
    // صندوقدار فقط صندوق‌های خودش را می‌بیند. اینجا اعمال می‌شود تا
    // فراموش‌کردنش در کنترلر ممکن نباشد.
    ...(actor.role === UserRole.cashier ? { cashierId: actor.id } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.cashierId && actor.role !== UserRole.cashier
      ? { cashierId: filters.cashierId }
      : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          businessDate: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
          },
        }
      : {}),
    // فیلتر مبلغ روی جمع اسناد است، نه مانده: همان عددی که حسابدار
    // هنگام جست‌وجوی یک صندوق مشخص در ذهن دارد.
    ...(filters.amountMin !== undefined || filters.amountMax !== undefined
      ? {
          documentsTotal: {
            ...(filters.amountMin !== undefined
              ? { gte: BigInt(filters.amountMin) }
              : {}),
            ...(filters.amountMax !== undefined
              ? { lte: BigInt(filters.amountMax) }
              : {}),
          },
        }
      : {}),
    ...(filters.onlyWithDiscrepancy
      ? {
          transactions: {
            some: {
              type: { in: [...DISCREPANCY_TYPES] },
              amount: { gt: 0 },
            },
          },
        }
      : {}),
  };
}
