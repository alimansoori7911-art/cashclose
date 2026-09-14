import type { TransactionType } from '@cashclose/shared';

/** یک تصویر پیوست‌شده به ردیف. */
export interface RowImage {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** یک ردیف در فرم؛ `key` فقط برای React است و به سرور نمی‌رود. */
export interface FormRow {
  key: string;
  /** شناسهٔ رکورد در دیتابیس؛ تا اولین ذخیره `null` است. */
  id: string | null;
  type: TransactionType;
  amount: number | null;
  description: string;
  terminalId: string | null;
  images: RowImage[];
}

let rowCounter = 0;
function nextKey(): string {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

export function createRow(
  type: TransactionType,
  overrides: Partial<FormRow> = {},
): FormRow {
  return {
    key: nextKey(),
    id: null,
    type,
    amount: null,
    description: '',
    terminalId: null,
    images: [],
    ...overrides,
  };
}

/**
 * عملیات روی مجموعهٔ ردیف‌ها — توابع خالص، بدون state.
 *
 * جدا از hook نگه داشته شده تا مستقل تست شوند و فایل state شلوغ نماند.
 */

/** جایگزینی بخشی از یک ردیف. */
export function patchRow(
  rows: FormRow[],
  key: string,
  patch: Partial<Omit<FormRow, 'key' | 'type'>>,
): FormRow[] {
  return rows.map((row) => (row.key === key ? { ...row, ...patch } : row));
}

/**
 * یافتن ردیف خالیِ یک قلم، یا ساخت ردیف تازه اگر همه پر باشند.
 *
 * دکمهٔ پیشنهاد باید کاربر را به فیلدی که از قبل در فرم هست ببرد؛ ساخت
 * ردیف تازه فقط یک فیلد خالیِ تکراری تولید می‌کرد.
 */
export function findOrCreateEmpty(
  rows: FormRow[],
  type: TransactionType,
): { rows: FormRow[]; key: string } {
  const empty = rows.find(
    (row) => row.type === type && (row.amount ?? 0) === 0,
  );

  if (empty) return { rows, key: empty.key };

  const created = createRow(type);
  return { rows: [...rows, created], key: created.key };
}

/**
 * هم‌گام‌سازی تصاویر با سرور — و **فقط** تصاویر.
 *
 * تصویر برخلاف مبلغ و توضیح سمت سرور تغییر می‌کند (آپلود و حذف مستقیم
 * انجام می‌شوند)، پس تنها منبع درست پاسخ سرور است.
 */
export function mergeImages(
  rows: FormRow[],
  byRowId: Map<string, FormRow['images']>,
): FormRow[] | null {
  let changed = false;

  const next = rows.map((row) => {
    if (!row.id) return row;

    const fresh = byRowId.get(row.id);
    if (!fresh) return row;

    // مقایسهٔ شناسه‌ها: بدون این، هر واکشی شیء تازه می‌سازد و رندر
    // بی‌پایان راه می‌افتد.
    const same =
      fresh.length === row.images.length &&
      fresh.every((image, index) => image.id === row.images[index]?.id);

    if (same) return row;

    changed = true;
    return { ...row, images: fresh };
  });

  return changed ? next : null;
}
