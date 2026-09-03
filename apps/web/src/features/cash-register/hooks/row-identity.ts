import type { FormRow } from './useRegisterForm';

/**
 * نشاندن شناسه‌های بازگشتی از سرور روی ردیف‌های فرم.
 *
 * چرا لازم است: ردیف تازه‌ساخته‌شده تا پیش از اولین ذخیره شناسه ندارد و
 * نمی‌توان به آن تصویر پیوست کرد. سرور پس از ذخیره شناسه‌ها را
 * برمی‌گرداند و اینجا به ردیف‌های متناظر نسبت داده می‌شوند.
 *
 * تطبیق بر اساس «نوع + ترتیب» انجام می‌شود، چون سرور هم دقیقاً با همین
 * ترتیب مرتب می‌کند.
 */
export interface SavedTransaction {
  id: string;
  type: string;
  sortOrder: number;
}

export function assignSavedIds(
  rows: FormRow[],
  saved: SavedTransaction[],
): FormRow[] {
  // شناسه‌هایی که از قبل روی ردیفی نشسته‌اند دوباره تخصیص داده نمی‌شوند،
  // وگرنه دو ردیف به یک رکورد اشاره می‌کردند.
  const taken = new Set(
    rows.map((row) => row.id).filter((id): id is string => Boolean(id)),
  );

  const pool = new Map<string, string[]>();
  for (const item of saved) {
    if (taken.has(item.id)) continue;
    const list = pool.get(item.type) ?? [];
    list.push(item.id);
    pool.set(item.type, list);
  }

  return rows.map((row) => {
    if (row.id) return row;

    const id = pool.get(row.type)?.shift();
    return id ? { ...row, id } : row;
  });
}

/**
 * تبدیل ردیف‌های فرم به بدنهٔ درخواست.
 *
 * ردیف کاملاً خالی حذف می‌شود، ولی ردیفی که تصویر دارد همیشه می‌ماند —
 * وگرنه حذف آن، تصاویرش را هم آبشاری از بین می‌برد.
 *
 * `id` ردیف‌های موجود فرستاده می‌شود تا سرور به‌جای حذف و ساخت دوباره،
 * همان رکورد را به‌روز کند و پیوست‌ها حفظ شوند.
 */
export function rowsToPayload(rows: FormRow[]) {
  return rows
    .filter(
      (row) =>
        row.amount !== null ||
        row.description.trim() !== '' ||
        row.images.length > 0,
    )
    .map((row, index) => ({
      ...(row.id ? { id: row.id } : {}),
      type: row.type,
      amount: row.amount ?? 0,
      ...(row.description.trim()
        ? { description: row.description.trim() }
        : {}),
      ...(row.terminalId ? { terminalId: row.terminalId } : {}),
      sortOrder: index,
    }));
}
