/**
 * فشرده‌سازی تصویر سمت کلاینت (بند ۱۴.۳ سند).
 *
 * چرا لازم است: عکس دوربین موبایل معمولاً ۴ تا ۸ مگابایت است و از سقف
 * ۳ مگابایتی رد می‌شود. بدون فشرده‌سازی، صندوقدار باید خودش عکس را
 * کوچک کند — که عملاً یعنی رها کردن آپلود.
 *
 * فشرده‌سازی با canvas انجام می‌شود تا وابستگی اضافه‌ای لازم نباشد.
 */

const MAX_DIMENSION = 1920;
const TARGET_QUALITY = 0.82;

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

/** آیا این فایل قالب تصویری پشتیبانی‌شده دارد؟ */
export function isSupportedImage(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

/**
 * کوچک‌کردن تصویر تا زیر سقف حجم.
 *
 * اگر فایل از قبل کوچک باشد، دست‌نخورده برمی‌گردد — فشرده‌سازی بی‌دلیل
 * فقط کیفیت را پایین می‌آورد.
 */
export async function compressImage(
  file: File,
  maxSizeBytes: number,
): Promise<CompressionResult> {
  if (file.size <= maxSizeBytes) {
    return { file, originalSize: file.size, compressedSize: file.size };
  }

  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      // بدون canvas کاری نمی‌شود کرد؛ فایل اصلی برمی‌گردد و بک‌اند
      // در صورت بزرگ‌بودن ردش می‌کند.
      return { file, originalSize: file.size, compressedSize: file.size };
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let quality = TARGET_QUALITY;
    let blob = await toBlob(canvas, quality);

    // اگر هنوز بزرگ است، کیفیت پله‌پله پایین می‌آید تا زیر سقف برود.
    while (blob && blob.size > maxSizeBytes && quality > 0.4) {
      quality -= 0.15;
      blob = await toBlob(canvas, quality);
    }

    if (!blob) {
      return { file, originalSize: file.size, compressedSize: file.size };
    }

    const compressed = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '') + '.jpg',
      { type: 'image/jpeg', lastModified: Date.now() },
    );

    return {
      file: compressed,
      originalSize: file.size,
      compressedSize: compressed.size,
    };
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality),
  );
}

/** نمایش خوانای حجم فایل. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} کیلوبایت`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} مگابایت`;
}
