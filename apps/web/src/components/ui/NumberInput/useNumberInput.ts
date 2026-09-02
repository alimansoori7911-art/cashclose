import { formatMoneyLatin, parseMoney } from '@cashclose/shared';
import { useState } from 'react';

/**
 * منطق ورودی مبلغ، جدا از ظاهر.
 *
 * چرا متن خام (`draft`) جدا نگه داشته می‌شود: اگر مقدار نمایشی مستقیماً
 * از prop محاسبه شود، حالت‌های میانی تایپ (مثلاً وقتی کاربر فیلد را خالی
 * می‌کند) باعث پرش مکان‌نما یا بازگشت ناگهانی مقدار قبلی می‌شوند.
 */
export function useNumberInput(
  value: number | null,
  onChange: (value: number | null) => void,
) {
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue =
    draft ?? (value === null ? '' : formatMoneyLatin(value));

  function handleChange(raw: string) {
    if (raw.trim() === '') {
      setDraft('');
      onChange(null);
      return;
    }

    const parsed = parseMoney(raw);
    // ورودی نامعتبر (حرف، یا مقدار بیش از سقف ۹ رقم) نادیده گرفته می‌شود
    // تا کاربر اصلاً نتواند حالت غیرمجاز بسازد.
    if (parsed === null) return;

    setDraft(formatMoneyLatin(parsed));
    onChange(parsed);
  }

  /** با خروج از فیلد، نمایش دوباره با مقدار واقعی هم‌گام می‌شود. */
  function handleBlur() {
    setDraft(null);
  }

  return { displayValue, handleChange, handleBlur };
}
