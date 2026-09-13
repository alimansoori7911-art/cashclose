import { useState } from 'react';

import { ApiError } from '../../../lib/api';
import { useCreateRegister } from './useRegisterApi';

/**
 * ساخت صندوق تازه.
 *
 * خطای ساخت جدا از خطای ذخیره نگه داشته می‌شود: هر کدام در جای خودشان
 * نمایش داده می‌شوند و قاطی‌شدنشان پیام گمراه‌کننده می‌سازد.
 */
export function useCreateFlow() {
  const createRegister = useCreateRegister();
  const [error, setError] = useState<string | null>(null);

  async function create(options: Parameters<
    typeof createRegister.mutateAsync
  >[0]): Promise<void> {
    setError(null);

    try {
      await createRegister.mutateAsync(options);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.displayMessage
          : 'ایجاد صندوق ناموفق بود.',
      );
    }
  }

  return { create, error, creating: createRegister.isPending };
}
