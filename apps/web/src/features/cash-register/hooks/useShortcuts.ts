import { useEffect } from 'react';

/**
 * میانبرهای کیبورد فرم صندوق.
 *
 * صندوقدار هر روز همین فرم را پر می‌کند؛ برداشتن دست از کیبورد برای
 * کلیک روی «ذخیره» ده‌ها بار در هفته تکرار می‌شود.
 *
 * فقط ذخیره میانبر دارد. «بستن صندوق» عمداً ندارد: عملیاتی است که
 * صندوق را قفل می‌کند و نباید با یک ترکیب کلید تصادفی رخ دهد.
 */
export function useShortcuts({
  enabled,
  onSave,
}: {
  enabled: boolean;
  onSave: () => void;
}) {
  useEffect(() => {
    if (!enabled) return;

    function handleKey(event: KeyboardEvent) {
      // Ctrl+S روی ویندوز و Cmd+S روی مک.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enabled, onSave]);
}
