import {
  getTransactionType,
  processChecksFor,
  suggestForDifference,
  type TransactionType,
} from '@cashclose/shared';
import { useMemo } from 'react';

import type { FormRow } from './useRegisterForm';

/** اقلام صندوق قبلی — فقط نوع و مبلغ لازم است. */
export interface PastAmount {
  type: string;
  amount: number;
}

/**
 * راهنمای رفع اختلاف.
 *
 * دو نوع کمک می‌دهد و هیچ‌کدام حدس نیست:
 *
 *  ۱. اقلام مرتبط با **جهت** اختلاف — از ریاضی معادله می‌آید.
 *  ۲. تفاوت با صندوق قبلی — واقعیتِ ثبت‌شده است، نه پیش‌بینی.
 *
 * عمداً «تطبیق دقیق مبلغ» پیاده نشده: اگر سامانه بگوید «کسری شما دقیقاً
 * برابر X است» و تصادفی باشد، صندوقدار عدد اشتباه را ثبت می‌کند، اختلاف
 * صفر می‌شود و خطا برای همیشه دفن. در کار مالی راهنمایی اشتباه بدتر از
 * نبودِ راهنمایی است.
 */
export interface TypeHint {
  type: TransactionType;
  label: string;
  hint: string;
}

export interface AnomalyHint {
  label: string;
  message: string;
}

export function useDifferenceHelp(
  rows: FormRow[],
  difference: number,
  previous: PastAmount[] | undefined,
) {
  /** اقلامی که صندوقدار امروز پر کرده — برای حذف از پیشنهادها. */
  const filled = useMemo(
    () =>
      rows
        .filter((row) => (row.amount ?? 0) > 0)
        .map((row) => row.type),
    [rows],
  );

  const suggestions = useMemo<TypeHint[]>(() => {
    if (difference === 0) return [];

    return suggestForDifference(difference, filled).map((type) => {
      const definition = getTransactionType(type);
      return { type, label: definition.label, hint: definition.hint };
    });
  }, [difference, filled]);

  /**
   * اقلامی که در صندوق قبلی مبلغ داشتند و امروز صفرند.
   *
   * شایع‌ترین خطا «فراموش‌کردن یک دستگاه» است؛ این مقایسه همان را
   * می‌گیرد، بدون آنکه چیزی را حدس بزند.
   */
  const anomalies = useMemo<AnomalyHint[]>(() => {
    if (difference === 0 || !previous?.length) return [];

    const todayByType = new Map<string, number>();
    for (const row of rows) {
      todayByType.set(
        row.type,
        (todayByType.get(row.type) ?? 0) + (row.amount ?? 0),
      );
    }

    const previousByType = new Map<string, number>();
    for (const item of previous) {
      previousByType.set(
        item.type,
        (previousByType.get(item.type) ?? 0) + item.amount,
      );
    }

    const result: AnomalyHint[] = [];

    for (const [type, pastAmount] of previousByType) {
      if (pastAmount <= 0) continue;
      if ((todayByType.get(type) ?? 0) > 0) continue;

      const definition = safeDefinition(type);
      if (!definition) continue;

      result.push({
        label: definition.label,
        message: `امروز خالی است — در صندوق قبلی ${pastAmount.toLocaleString('fa-IR')} ریال داشت.`,
      });
    }

    // سقف سه مورد: فهرست بلند، خودش نویز می‌شود.
    return result.slice(0, 3);
  }, [rows, difference, previous]);

  /**
   * بررسی‌های فرایندی — خطاهایی که قلم مالی نیستند.
   *
   * «کارت کشیده ولی ثبت نشده» و «ثبت شده ولی کارت نکشیده» هر دو شایع‌اند
   * ولی جهتشان مخالف هم است؛ هرکدام فقط در سمت خودش می‌آید.
   */
  const processChecks = useMemo(
    () => processChecksFor(difference),
    [difference],
  );

  /** جمع هر قلم در صندوق قبلی — برای نمایش زیر همان قلم. */
  const previousByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of previous ?? []) {
      map.set(item.type, (map.get(item.type) ?? 0) + item.amount);
    }
    return map;
  }, [previous]);

  return { suggestions, anomalies, processChecks, previousByType };
}

/** نوع ناشناخته (مثلاً پس از تغییر اسکیما) نباید صفحه را بشکند. */
function safeDefinition(type: string) {
  try {
    return getTransactionType(type as TransactionType);
  } catch {
    return null;
  }
}
