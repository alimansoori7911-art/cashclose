/**
 * قرارداد ذخیره‌سازی فایل.
 *
 * هدف این لایه: مهاجرت از دیسک لوکال به S3 یا هر آبجکت‌استوریج دیگر
 * باید فقط با نوشتن یک پیاده‌سازی جدید ممکن باشد، بدون دست‌زدن به هیچ
 * سرویس کسب‌وکاری.
 *
 * به همین دلیل سرویس‌ها همیشه `storageKey` (کلید داخلی) را ذخیره
 * می‌کنند، نه URL مطلق — URL می‌تواند در هر Provider شکل متفاوتی داشته
 * باشد یا امضاشده و منقضی‌شونده باشد.
 */

export interface StoredFile {
  /** کلید یکتای فایل نزد Provider. */
  readonly key: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
}

export interface StorageProvider {
  /** ذخیرهٔ محتوا و برگرداندن کلید. */
  save(input: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    /** پوشهٔ منطقی — معمولاً شناسهٔ مستأجر برای جداسازی. */
    scope: string;
  }): Promise<StoredFile>;

  /** خواندن محتوای فایل. */
  read(key: string): Promise<Buffer>;

  /** حذف فایل؛ نبودِ فایل خطا محسوب نمی‌شود. */
  delete(key: string): Promise<void>;

  /** آیا فایل وجود دارد؟ */
  exists(key: string): Promise<boolean>;
}

/** توکن تزریق وابستگی. */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
