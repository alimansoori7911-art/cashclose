import { useCallback, useEffect, useState } from 'react';

/**
 * هدایت صندوقدار به ردیفی که باید پر شود.
 *
 * دکمهٔ پیشنهاد بدون این کار بی‌اثر به نظر می‌رسید: ردیف مورد نظر در
 * بخش جمع‌شده بود و کاربر هیچ تغییری روی صفحه نمی‌دید، پس فکر می‌کرد
 * دکمه خراب است.
 *
 * سه کار با هم انجام می‌شود — بازکردن بخش، اسکرول، و فوکوس — چون هر سه
 * لازم است تا کاربر بفهمد چه اتفاقی افتاد.
 */
export function useFocusRow() {
  /**
   * کلید ردیف هدف، به‌همراه شمارنده.
   *
   * شمارنده لازم است تا کلیک دوباره روی همان پیشنهاد هم اثر کند؛ بدون
   * آن مقدار state عوض نمی‌شد و اثر جانبی دوباره اجرا نمی‌شد.
   */
  const [target, setTarget] = useState<{ key: string; nonce: number } | null>(
    null,
  );

  const focusRow = useCallback((key: string) => {
    setTarget((current) => ({ key, nonce: (current?.nonce ?? 0) + 1 }));
  }, []);

  /**
   * فوکوس **پس از** رندر انجام می‌شود، نه داخل همان کلیک.
   *
   * ردیف هدف ممکن است در بخش جمع‌شده باشد؛ آن بخش تازه با همین `target`
   * باز می‌شود، پس در لحظهٔ کلیک هنوز در DOM نیست و `querySelector`
   * چیزی پیدا نمی‌کرد.
   */
  useEffect(() => {
    if (!target) return;

    const element = document.querySelector<HTMLElement>(
      `[data-row-key="${target.key}"] input`,
    );

    if (!element) return;

    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    element.focus();
  }, [target]);

  return { target: target?.key ?? null, focusRow };
}
