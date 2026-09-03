import { useQuery } from '@tanstack/react-query';

import { api } from '../../../lib/api';

/**
 * دریافت لینک کوتاه‌مدت تصویر.
 *
 * تگ `<img>` هدر Authorization نمی‌فرستد، پس نمی‌توان مستقیم به مسیر
 * محافظت‌شده اشاره کرد. اول این لینک امضاشده گرفته می‌شود و بعد در
 * `src` می‌نشیند.
 */
export function useImageLink(uploadId: string) {
  return useQuery({
    queryKey: ['upload-link', uploadId],
    queryFn: () =>
      api.get<{ url: string; expiresAt: number }>(`/uploads/${uploadId}/link`),
    // لینک ۱۵ دقیقه اعتبار دارد؛ کمی زودتر تازه می‌شود تا تصویر وسط کار
    // نشکند.
    staleTime: 12 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
