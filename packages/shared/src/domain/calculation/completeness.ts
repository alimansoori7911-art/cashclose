import { getTransactionType } from '../transactions/index.js';
import type { TransactionType } from '../transactions/index.js';

/**
 * بررسی کامل‌بودن اقلام اجباری (ستون «اجباری» سند ورژن ۲).
 *
 * تصمیم طراحی: نبودِ عکس یا توضیح اجباری **جلوی بستن صندوق را
 * نمی‌گیرد**. اگر می‌گرفت، صندوقدار ساعت ۱۱ شب که اسکنر خراب است یا
 * عکس رسید گم شده، گیر می‌کرد و راهی جز رهاکردن صندوق نداشت.
 *
 * به‌جایش صندوقدار باید **بنویسد چرا** — و همان دلیل در توضیح ردیف
 * ذخیره می‌شود تا حسابدار هنگام بررسی ببیندش. هم انعطاف می‌دهد هم
 * ردپا نگه می‌دارد.
 */

/** یک ردیف از دید بررسی کامل‌بودن. */
export interface CompletenessRow {
  type: TransactionType;
  amount: number;
  description: string;
  imageCount: number;
}

/** آنچه در یک ردیف کم است. */
export interface MissingItem {
  type: TransactionType;
  label: string;
  missingImages: boolean;
  missingDescription: boolean;
}

/**
 * ردیف‌هایی که قلم اجباریشان کم است.
 *
 * فقط ردیف‌های **دارای مبلغ** بررسی می‌شوند: ردیف صفر یعنی آن قلم امروز
 * اصلاً رخ نداده، پس مطالبهٔ عکس برایش بی‌معناست.
 */
export function findMissingRequired(
  rows: readonly CompletenessRow[],
): MissingItem[] {
  const missing: MissingItem[] = [];

  for (const row of rows) {
    if (row.amount <= 0) continue;

    const definition = getTransactionType(row.type);
    const hasText = row.description.trim().length > 0;

    const missingImages = definition.requiresImages && row.imageCount === 0;

    // توضیح دو نقش دارد: هم فیلد اجباری خودش، هم جای نوشتن دلیلِ
    // نبودِ عکس. پس اگر عکس اجباری نیست ولی توضیح خالی است، همان کمبود
    // شمرده می‌شود.
    const missingDescription =
      (definition.requiresDescription || missingImages) && !hasText;

    if (missingImages || missingDescription) {
      missing.push({
        type: row.type,
        label: definition.label,
        missingImages,
        missingDescription,
      });
    }
  }

  return missing;
}

/**
 * آیا بستن صندوق نیازمند گرفتن توضیح از صندوقدار است؟
 *
 * تنها چیزی که واقعاً جلوی بستن را می‌گیرد، **نبودِ توضیح** است — چون
 * توضیح تنها راهی است که صندوقدار می‌تواند نبودِ عکس را توجیه کند.
 */
export function needsExplanation(missing: readonly MissingItem[]): boolean {
  return missing.some((item) => item.missingDescription);
}
