import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../lib/api';

/**
 * hookهای مشترک صفحات مدیریت.
 *
 * الگوی یکسان برای هر موجودیت: خواندن فهرست + ساخت + ویرایش +
 * غیرفعال‌سازی، با بی‌اعتبارکردن خودکار کش پس از هر تغییر.
 */

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  storeId: string;
  store: { id: string; name: string };
  _count: { users: number; posTerminals: number };
}

export interface AdminUser {
  id: string;
  fullName: string;
  username: string;
  role: string;
  status: string;
  branchId: string | null;
  branch: { id: string; name: string } | null;
  lastLoginAt: string | null;
}

export interface PosTerminal {
  id: string;
  name: string;
  bank: string | null;
  cardNumber: string | null;
  isActive: boolean;
  branchId: string;
  branch: { id: string; name: string };
  assignedTo: { id: string; fullName: string } | null;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  meta: unknown;
  createdAt: string;
  user: { id: string; fullName: string; username: string } | null;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get<Paginated<Branch>>('/branches', { limit: 100 }),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<Paginated<AdminUser>>('/users', { limit: 100 }),
  });
}

export function useTerminals() {
  return useQuery({
    queryKey: ['pos-terminals'],
    queryFn: () => api.get<PosTerminal[]>('/pos-terminals'),
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () =>
      api.get<Paginated<AuditLogEntry>>('/audit-logs', { limit: 50 }),
  });
}

/**
 * ساخت رکورد جدید.
 *
 * پس از موفقیت، کش همان کلید باطل می‌شود تا فهرست بدون رفرش دستی
 * به‌روز شود.
 */
export function useCreate<TBody, TResult>(
  path: string,
  queryKey: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TBody) => api.post<TResult>(path, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });
}

export function useUpdate<TBody, TResult>(
  pathBuilder: (id: string) => string,
  queryKey: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TBody }) =>
      api.patch<TResult>(pathBuilder(id), body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });
}

export function useDeactivate(
  pathBuilder: (id: string) => string,
  queryKey: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ message: string }>(pathBuilder(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
  });
}
