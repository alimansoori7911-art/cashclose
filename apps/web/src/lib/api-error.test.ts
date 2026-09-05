import { describe, expect, it } from 'vitest';

import { ApiError } from './api-error';

describe('کد پیگیری در پیام خطا', () => {
  const requestId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

  it('در خطای سرور نمایش داده می‌شود', () => {
    const error = new ApiError('خطای سرور.', 500, 'INTERNAL', requestId);

    expect(error.displayMessage).toBe('خطای سرور. (کد پیگیری: 3f2504e0)');
  });

  it('در خطای اعتبارسنجی نمایش داده نمی‌شود', () => {
    // این خطا را خود کاربر رفع می‌کند؛ کد پیگیری فقط پیام را شلوغ می‌کند.
    const error = new ApiError('مبلغ معتبر نیست.', 400, 'VALIDATION', requestId);

    expect(error.displayMessage).toBe('مبلغ معتبر نیست.');
  });

  it('بدون شناسه، پیام دست‌نخورده می‌ماند', () => {
    const error = new ApiError('خطای سرور.', 500);

    expect(error.displayMessage).toBe('خطای سرور.');
  });

  it('خطای شبکه هم کد پیگیری ندارد', () => {
    // درخواست اصلاً به سرور نرسیده، پس شناسه‌ای هم ساخته نشده است.
    const error = new ApiError('ارتباط برقرار نشد.', 0, 'NETWORK_ERROR');

    expect(error.displayMessage).toBe('ارتباط برقرار نشد.');
  });
});
