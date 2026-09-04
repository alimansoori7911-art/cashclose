import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../lib/api';
import type { Paginated } from '../../admin/hooks/useAdminData';

export interface ReviewRegister {
  id: string;
  businessDate: string;
  coversUntilDate: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  registerBalance: number;
  documentsTotal: number;
  difference: number;
  submittedAt: string | null;
  branch: { id: string; name: string };
  cashier: { id: string; fullName: string };
}

export interface RegisterFilters {
  status?: string;
  branchId?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** فهرست صندوق‌ها برای حسابدار، با فیلترهای سمت سرور (بند AC6 سند). */
export function useRegisterList(filters: RegisterFilters) {
  return useQuery({
    queryKey: ['review-registers', filters],
    queryFn: () =>
      api.get<Paginated<ReviewRegister>>('/cash-registers', {
        limit: 50,
        // مقادیر خالی فرستاده نمی‌شوند تا فیلتر بی‌اثر نشود.
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => Boolean(value)),
        ),
      }),
  });
}

export interface VersionSummary {
  id: string;
  versionNumber: number;
  submittedAt: string;
  createdBy: { id: string; fullName: string } | null;
}

export function useVersions(registerId: string | undefined) {
  return useQuery({
    queryKey: ['versions', registerId],
    queryFn: () =>
      api.get<VersionSummary[]>(`/cash-registers/${registerId}/versions`),
    enabled: Boolean(registerId),
  });
}

export interface TransactionDiff {
  type: string;
  kind: 'added' | 'removed' | 'changed' | 'unchanged';
  before: { amount: string; description: string | null } | null;
  after: { amount: string; description: string | null } | null;
}

export interface VersionComparison {
  from: { versionNumber: number; submittedAt: string; submittedBy: string | null };
  to: { versionNumber: number; submittedAt: string; submittedBy: string | null };
  diff: {
    totals: Record<
      'registerBalance' | 'documentsTotal' | 'difference',
      { before: string; after: string; changed: boolean }
    >;
    transactions: TransactionDiff[];
    changedCount: number;
  };
}

/** مقایسهٔ دو نسخه؛ بدون شماره، دو نسخهٔ آخر مقایسه می‌شوند. */
export function useVersionComparison(
  registerId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['version-compare', registerId],
    queryFn: () =>
      api.get<VersionComparison>(
        `/cash-registers/${registerId}/versions/compare`,
      ),
    enabled: Boolean(registerId) && enabled,
    // صندوقی که یک نسخه دارد قابل مقایسه نیست؛ تلاش دوباره بی‌فایده است.
    retry: false,
  });
}

export function useApprove(registerId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment?: string) =>
      api.post<{ message: string }>(`/cash-registers/${registerId}/approve`, {
        ...(comment ? { comment } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['review-registers'] });
      void queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    },
  });
}

export function useReject(registerId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: string) =>
      api.post<{ message: string }>(`/cash-registers/${registerId}/reject`, {
        comment,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['review-registers'] });
      void queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    },
  });
}
