import { useEffect, useRef } from 'react';

/**
 * ذخیرهٔ خودکار پس از توقف تایپ.
 *
 * چرا لازم است: بند ۱۲.۱ سند می‌گوید قطع اینترنت نباید کار صندوقدار را
 * از بین ببرد. ذخیرهٔ خودکار پنجرهٔ از دست رفتن داده را از «کل شیفت» به
 * «چند ثانیه» کاهش می‌دهد.
 *
 * نکته: تایمر با هر تغییر ریست می‌شود (debounce)، پس حین تایپ پیوسته
 * درخواستی فرستاده نمی‌شود.
 */
export function useAutoSave({
  enabled,
  isDirty,
  onSave,
  delayMs = 4000,
}: {
  enabled: boolean;
  isDirty: boolean;
  onSave: () => void;
  delayMs?: number;
}) {
  // در ref نگه داشته می‌شود تا تغییر تابع، تایمر را ریست نکند.
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  useEffect(() => {
    if (!enabled || !isDirty) return;

    const timer = setTimeout(() => saveRef.current(), delayMs);
    return () => clearTimeout(timer);
  }, [enabled, isDirty, delayMs]);
}

/**
 * هشدار هنگام خروج با تغییرات ذخیره‌نشده (بند ۸.۳ سند).
 *
 * مرورگرها متن دلخواه را نادیده می‌گیرند و پیام استاندارد خودشان را
 * نشان می‌دهند؛ فقط فعال‌بودن هشدار در کنترل ماست.
 */
export function useUnsavedWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
