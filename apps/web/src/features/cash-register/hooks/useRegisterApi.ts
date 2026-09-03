import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../lib/api';

/** انواع پاسخ API صندوق. */

export interface RegisterSummary {
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

export interface RegisterTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  terminalId: string | null;
  sortOrder: number;
  terminal: { id: string; name: string; bank: string | null } | null;
}

export interface RegisterDetail extends RegisterSummary {
  finalNotes: string | null;
  transactions: RegisterTransaction[];
  history: {
    id: string;
    status: string;
    comment: string | null;
    createdAt: string;
    createdBy: { id: string; fullName: string } | null;
  }[];
}

export interface DraftResult {
  id: string;
  registerBalance: number;
  documentsTotal: number;
  difference: number;
  cashStatus: string;
  canClose: boolean;
  savedAt: string;
}

/** صندوق باز فعلی صندوقدار؛ `null` یعنی هنوز صندوقی ساخته نشده. */
export function useCurrentRegister() {
  return useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => api.get<RegisterSummary | null>('/cash-registers/current'),
  });
}

export function useRegisterDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['cash-register', id],
    queryFn: () => api.get<RegisterDetail>(`/cash-registers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { businessDate: string }) =>
      api.post<RegisterSummary>('/cash-registers', body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['cash-register'] }),
  });
}

export interface DraftPayload {
  transactions: {
    type: string;
    amount: number;
    description?: string;
    terminalId?: string;
    sortOrder?: number;
  }[];
  finalNotes?: string;
}

export function useSaveDraft(id: string | undefined) {
  return useMutation({
    mutationFn: (body: DraftPayload) =>
      api.patch<DraftResult>(`/cash-registers/${id}/draft`, body),
  });
}

export function useCloseRegister(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.patch<{ status: string; message: string }>(
        `/cash-registers/${id}/close`,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['cash-register'] }),
  });
}
