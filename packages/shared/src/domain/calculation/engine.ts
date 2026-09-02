/**
 * موتور محاسبهٔ صندوق — تنها پیاده‌سازی فرمول در کل سیستم.
 *
 * هم بک‌اند (اعتبارسنجی قطعی پیش از بستن صندوق) و هم فرانت‌اند (نمایش
 * زندهٔ اختلاف حین تایپ) همین تابع را صدا می‌زنند تا امکان واگرایی منطق
 * بین دو سمت وجود نداشته باشد.
 *
 * فرمول (منبع: سلول‌های B15/B17/B18 فایل «صندوق (3).xlsm»):
 *
 *   مانده صندوق = Σ(اقلام مثبت) − Σ(اقلام منفی)
 *   جمع اسناد   = Σ(چک + کارتخوان + کارت‌به‌کارت + نقدی + ارز + درگاه)
 *   اختلاف      = جمع اسناد − مانده صندوق
 *
 *   اختلاف = ۰  → تراز  (صندوق قابل بستن)
 *   اختلاف > ۰  → مازاد (بستن غیرمجاز)
 *   اختلاف < ۰  → کسری  (بستن غیرمجاز)
 *
 * محاسبات با bigint انجام می‌شود: در سامانه‌ای که شرط بستن صندوق «اختلاف
 * دقیقاً صفر» است، خطای گِرد کردن ممیز شناور غیرقابل‌قبول است.
 */

import { FormulaSide, getTransactionType } from '../transactions/index.js';
import {
  CashStatus,
  type CalculationInput,
  type CashCalculationResult,
} from './types.js';

function toBigInt(amount: number | bigint): bigint {
  if (typeof amount === 'bigint') return amount;
  if (!Number.isFinite(amount)) {
    throw new Error(`مبلغ نامعتبر است: ${amount}`);
  }
  if (!Number.isInteger(amount)) {
    throw new Error(`مبلغ باید عدد صحیح باشد (ریال): ${amount}`);
  }
  return BigInt(amount);
}

/**
 * محاسبهٔ مانده صندوق، جمع اسناد و اختلاف.
 *
 * ورودی با مبلغ صفر مجاز است (صندوقدار می‌تواند کارتخوانی را بدون مبلغ
 * رها کند). مبلغ منفی خطاست — علامت هر قلم از روی `side` آن تعیین
 * می‌شود، نه از روی علامت عدد.
 */
export function calculateCashRegister(
  inputs: readonly CalculationInput[],
): CashCalculationResult {
  let balanceAdditions = 0n;
  let balanceSubtractions = 0n;
  let documents = 0n;
  const totalsByType: Record<string, bigint> = {};

  for (const input of inputs) {
    const definition = getTransactionType(input.type);
    const amount = toBigInt(input.amount);

    if (amount < 0n) {
      throw new Error(
        `مبلغ «${definition.label}» نمی‌تواند منفی باشد: ${amount}`,
      );
    }

    totalsByType[input.type] = (totalsByType[input.type] ?? 0n) + amount;

    switch (definition.side) {
      case FormulaSide.BALANCE_ADD:
        balanceAdditions += amount;
        break;
      case FormulaSide.BALANCE_SUBTRACT:
        balanceSubtractions += amount;
        break;
      case FormulaSide.DOCUMENT:
        documents += amount;
        break;
    }
  }

  const registerBalance = balanceAdditions - balanceSubtractions;
  const difference = documents - registerBalance;

  const status: CashStatus =
    difference === 0n
      ? CashStatus.BALANCED
      : difference > 0n
        ? CashStatus.SURPLUS
        : CashStatus.SHORTAGE;

  return {
    registerBalance,
    documentsTotal: documents,
    difference,
    status,
    canClose: difference === 0n,
    breakdown: { balanceAdditions, balanceSubtractions, documents },
    totalsByType,
  };
}
