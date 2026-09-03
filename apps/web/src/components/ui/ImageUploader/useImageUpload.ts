import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { compressImage, isSupportedImage } from '../../../lib/image-compression';
import { api, ApiError } from '../../../lib/api';

const MAX_SIZE_BYTES = 3 * 1024 * 1024;

/**
 * منطق آپلود تصویر، جدا از ظاهر.
 *
 * فایل‌ها یکی‌یکی و به‌ترتیب فرستاده می‌شوند نه موازی: سقف «۵ عکس» را
 * بک‌اند می‌شمارد و ارسال موازی می‌تواند از آن رد شود (شرایط مسابقه).
 */
export function useImageUpload(transactionId: string | null, max: number) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  const uploadFiles = useCallback(
    async (files: File[], currentCount: number) => {
      if (!transactionId || files.length === 0) return;

      setError(null);

      const remaining = max - currentCount;
      if (remaining <= 0) {
        setError(`حداکثر ${max.toLocaleString('fa-IR')} تصویر مجاز است.`);
        return;
      }

      const accepted = files.slice(0, remaining);
      if (files.length > remaining) {
        setError(
          `فقط ${remaining.toLocaleString('fa-IR')} تصویر دیگر قابل افزودن است.`,
        );
      }

      setUploading(true);
      setProgress({ done: 0, total: accepted.length });

      try {
        for (const [index, original] of accepted.entries()) {
          if (!isSupportedImage(original)) {
            setError('فقط تصویر JPG، PNG یا WebP پذیرفته می‌شود.');
            continue;
          }

          const { file } = await compressImage(original, MAX_SIZE_BYTES);

          const form = new FormData();
          form.append('file', file);

          await api.upload(`/uploads/transactions/${transactionId}`, form);

          setProgress({ done: index + 1, total: accepted.length });
        }

        await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'آپلود ناموفق بود. دوباره تلاش کنید.',
        );
      } finally {
        setUploading(false);
        setProgress({ done: 0, total: 0 });
      }
    },
    [transactionId, max, queryClient],
  );

  const removeImage = useCallback(
    async (uploadId: string) => {
      setError(null);
      try {
        await api.delete(`/uploads/${uploadId}`);
        await queryClient.invalidateQueries({ queryKey: ['cash-register'] });
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'حذف تصویر ناموفق بود.',
        );
      }
    },
    [queryClient],
  );

  return { uploadFiles, removeImage, uploading, progress, error, setError };
}
