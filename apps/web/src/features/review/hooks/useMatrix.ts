import { useQuery } from '@tanstack/react-query';

import { api } from '../../../lib/api';
import type { RegisterFilters } from './useReviewApi';

export interface CellImage {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** یک خانهٔ جدول — مبلغ به‌همراه آنچه پشتش است. */
export interface MatrixCell {
  amount: string;
  descriptions: string[];
  images: CellImage[];
}

export interface MatrixRow {
  id: string;
  date: string;
  coversUntil: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  branchName: string;
  cashierName: string;
  registerBalance: number;
  documentsTotal: number;
  difference: number;
  cells: Record<string, MatrixCell>;
}

/**
 * نمای جدولی چند صندوق.
 *
 * صفحه‌بندی ندارد: سرور سقف ثابتی برمی‌گرداند چون جدولی با صدها ردیف
 * نه در مرورگر قابل استفاده است نه برای سرور ارزان تمام می‌شود. برای
 * بازهٔ بزرگ‌تر، فیلتر تاریخ راه درست است.
 */
export function useMatrix(filters: RegisterFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['registers-matrix', filters],
    queryFn: () =>
      api.get<MatrixRow[]>('/registers-matrix', {
        // مقادیر خالی فرستاده نمی‌شوند تا فیلتر بی‌اثر نشود.
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value !== undefined && value !== '',
          ),
        ),
      }),
    enabled,
  });
}
