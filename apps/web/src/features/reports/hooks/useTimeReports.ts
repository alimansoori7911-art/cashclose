import { useQuery } from '@tanstack/react-query';

import { api } from '../../../lib/api';
import { clean } from './report-filters';

/**
 * گزارش‌های زمان‌محور: پیش‌بینی ماه، روند سالانه و مقایسه با سال قبل.
 *
 * از بقیهٔ گزارش‌ها جدا شده چون همه بر پایهٔ **تقویم شمسی** کار می‌کنند و
 * پارامترشان سال و ماه است، نه بازهٔ تاریخ و شعبه.
 */

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

export interface YearComparison {
  year: number;
  previousYear: number;
  months: {
    month: number;
    current: number;
    previous: number;
    growthPercent: number | null;
    isFuture: boolean;
  }[];
  currentTotal: number;
  previousTotal: number;
  growthPercent: number | null;
  comparablePrevious: number;
}

/** مقایسهٔ نظیربه‌نظیر دوازده ماه با سال قبل (بند ۸ سمت مالک). */
export function useYearComparison(year: number | undefined, branchId?: string) {
  return useQuery({
    queryKey: ['reports', 'year-comparison', year, branchId],
    queryFn: () =>
      api.get<YearComparison>(
        '/reports/year-comparison',
        clean({ year, branchId }),
      ),
  });
}
