import { useQuery } from '@tanstack/react-query';

import { api } from '../../../lib/api';
import { clean, type ReportFilters } from './report-filters';

export type { ReportFilters };

export interface DailySales {
  date: string;
  sales: number;
  registerBalance: number;
  difference: number;
  registerCount: number;
}

export function useDailySales(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'daily-sales', filters],
    queryFn: () =>
      api.get<DailySales[]>('/reports/daily-sales', clean(filters)),
  });
}

export interface BranchSales {
  branchId: string;
  branchName: string;
  sales: number;
  difference: number;
  registerCount: number;
}

export function useBranchComparison(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'branches', filters],
    queryFn: () =>
      api.get<BranchSales[]>('/reports/branch-comparison', clean(filters)),
  });
}

export type StatusSummary = Record<
  'draft' | 'submitted' | 'approved' | 'rejected',
  { count: number; sales: number }
>;

export function useStatusSummary(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'status', filters],
    queryFn: () =>
      api.get<StatusSummary>('/reports/status-summary', clean(filters)),
  });
}


export interface UnsettledReport {
  total: number;
  count: number;
  items: {
    id: string;
    amount: number;
    description: string | null;
    date: string;
    branchName: string;
    cashierName: string;
    registerStatus: string;
  }[];
}

export function useUnsettled(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'unsettled', filters],
    queryFn: () =>
      api.get<UnsettledReport>('/reports/unsettled-purchases', clean(filters)),
  });
}

export interface SurplusShortage {
  surplusTotal: number;
  shortageTotal: number;
  netTotal: number;
  items: {
    id: string;
    type: string;
    amount: number;
    description: string | null;
    date: string;
    branchName: string;
    cashierName: string;
  }[];
}

export function useSurplusShortage(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'surplus', filters],
    queryFn: () =>
      api.get<SurplusShortage>('/reports/surplus-shortage', clean(filters)),
  });
}
