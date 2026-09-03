import { TransactionType as PrismaType } from '@prisma/client';

import {
  TRANSACTION_TYPE_VALUES,
  TransactionType as SharedType,
} from '@cashclose/shared';

/**
 * پل نوع بین enum پریزما و بستهٔ مشترک.
 *
 * هر دو رشته‌های یکسانی دارند، ولی TypeScript آن‌ها را دو نوع مستقل
 * می‌بیند. به‌جای پخش‌کردن `as` در سرویس‌ها، تبدیل یک‌جا و همراه با یک
 * تست انجام می‌شود که تضمین می‌کند این دو فهرست هرگز واگرا نشوند.
 */
export function toSharedType(type: PrismaType): SharedType {
  return type as string as SharedType;
}

/** آیا این دو enum دقیقاً هم‌ارزند؟ (مبنای تست هم‌گامی) */
export function enumsAreInSync(): boolean {
  const prismaValues = Object.values(PrismaType).sort();
  const sharedValues = [...TRANSACTION_TYPE_VALUES].sort();

  return (
    prismaValues.length === sharedValues.length &&
    prismaValues.every((value, index) => value === sharedValues[index])
  );
}

/** اختلاف دو فهرست — برای پیام خطای خوانا در تست. */
export function enumDifference(): {
  onlyInPrisma: string[];
  onlyInShared: string[];
} {
  const prismaValues = new Set<string>(Object.values(PrismaType));
  const sharedValues = new Set<string>(TRANSACTION_TYPE_VALUES);

  return {
    onlyInPrisma: [...prismaValues].filter((v) => !sharedValues.has(v)),
    onlyInShared: [...sharedValues].filter((v) => !prismaValues.has(v)),
  };
}
