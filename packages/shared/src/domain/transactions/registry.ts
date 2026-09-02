/**
 * رجیستری اقلام تراکنش — نقطهٔ دسترسی به جدول تعریف‌ها.
 *
 * داده در `definitions/` است و اینجا فقط منطقِ کار با آن قرار دارد
 * (جست‌وجو، فیلتر بر اساس سمت فرمول). افزودن یک قلم جدید = افزودن یک
 * ردیف به فایل مربوطه در `definitions/`؛ این فایل تغییر نمی‌کند.
 */

import { BALANCE_ADDITIONS } from './definitions/balance-additions.js';
import { BALANCE_SUBTRACTIONS } from './definitions/balance-subtractions.js';
import { DOCUMENT_ITEMS } from './definitions/documents.js';
import {
  FormulaSide,
  type TransactionType,
  type TransactionTypeDefinition,
} from './types.js';

/** جدول کامل ۲۲ قلمی، به ترتیب سمت فرمول. */
export const TRANSACTION_TYPES: readonly TransactionTypeDefinition[] = [
  ...BALANCE_ADDITIONS,
  ...BALANCE_SUBTRACTIONS,
  ...DOCUMENT_ITEMS,
];

/** نگاشت سریع `type` به تعریف آن. */
export const TRANSACTION_TYPE_MAP: ReadonlyMap<
  TransactionType,
  TransactionTypeDefinition
> = new Map(TRANSACTION_TYPES.map((def) => [def.type, def]));

/** همهٔ شناسه‌های مجاز — برای اعتبارسنجی و enum دیتابیس. */
export const TRANSACTION_TYPE_VALUES: readonly TransactionType[] =
  TRANSACTION_TYPES.map((def) => def.type);

export function getTransactionType(
  type: TransactionType,
): TransactionTypeDefinition {
  const definition = TRANSACTION_TYPE_MAP.get(type);
  if (!definition) {
    throw new Error(`نوع تراکنش نامعتبر است: ${type}`);
  }
  return definition;
}

/** اقلام یک سمت مشخص از فرمول. */
export function getTypesBySide(
  side: FormulaSide,
): readonly TransactionTypeDefinition[] {
  return TRANSACTION_TYPES.filter((def) => def.side === side);
}

export { BALANCE_ADDITIONS, BALANCE_SUBTRACTIONS, DOCUMENT_ITEMS };
