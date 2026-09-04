import { useQuery } from '@tanstack/react-query';

import { api } from '../../../lib/api';

/** فیلتر مشترک گزارش‌ها. */
export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

/** پارامترهای خالی حذف می‌شوند تا فیلتر بی‌اثر نشود. */
function clean(filters: ReportFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value)),
  ) as Record<string, string>;
}

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

export interface Forecast {
  year: number;
  month: number;
  salesToDate: number;
  dailyAverage: number;
  projectedTotal: number;
  daysElapsed: number;
  daysInMonth: number;
  daysRemaining: number;
  isComplete: boolean;
  previousYear: { year: number; sales: number; registerCount: number };
  growthPercent: number | null;
  registerCount: number;
}

export function useForecast(branchId?: string) {
  return useQuery({
    queryKey: ['reports', 'forecast', branchId],
    queryFn: () =>
      api.get<Forecast>(
        '/reports/monthly-forecast',
        branchId ? { branchId } : undefined,
      ),
  });
}

export interface MonthlyTrend {
  year: number;
  months: { month: number; sales: number; registerCount: number }[];
}

export function useMonthlyTrend(branchId?: string) {
  return useQuery({
    queryKey: ['reports', 'trend', branchId],
    queryFn: () =>
      api.get<MonthlyTrend>(
        '/reports/monthly-trend',
        branchId ? { branchId } : undefined,
      ),
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
