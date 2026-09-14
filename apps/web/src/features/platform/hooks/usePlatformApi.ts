import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { platformApi } from '../platform-client';

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  code: string;
  status: 'active' | 'suspended';
  createdAt: string;
  _count: { stores: number; branches: number; users: number };
}

export interface CreateTenantBody {
  name: string;
  slug: string;
  storeName?: string;
  ownerFullName: string;
  ownerUsername: string;
  ownerPassword: string;
}

export interface CreateTenantResult {
  tenant: { id: string; name: string; slug: string; code: string };
  store: { id: string; name: string };
  owner: { id: string; username: string; fullName: string };
}

export function usePlatformLogin() {
  return useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      platformApi.post<{
        accessToken: string;
        admin: { fullName: string };
      }>('/login', body),
  });
}

export function useTenantList(enabled: boolean) {
  return useQuery({
    queryKey: ['platform', 'tenants'],
    queryFn: () => platformApi.get<TenantSummary[]>('/tenants'),
    enabled,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTenantBody) =>
      platformApi.post<CreateTenantResult>('/tenants', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform'] }),
  });
}

export function useTenantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) =>
      platformApi.patch<{ message: string }>(
        `/tenants/${id}/${suspend ? 'suspend' : 'activate'}`,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform'] }),
  });
}
