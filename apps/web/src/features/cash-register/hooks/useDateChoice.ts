import {
  addDaysIso,
  formatJalaliLong,
  MAX_BACKDATE_DAYS,
  todayIso,
} from '@cashclose/shared';
import { useMemo, useState } from 'react';

/**
 * انتخاب تاریخ هنگام ساخت صندوق.
 *
 * جدا از کامپوننت نگه داشته شده چون قاعده دارد، نه فقط ظاهر: بازهٔ مجاز
 * و شرط فعال‌شدن حالت دوروزه هر دو اینجا تصمیم گرفته می‌شوند.
 */
export function useDateChoice() {
  const today = todayIso();

  const [businessDate, setBusinessDate] = useState(today);
  const [isTwoDay, setTwoDay] = useState(false);

  /**
   * روزهای قابل انتخاب — از امروز تا سقف مجاز.
   *
   * تعطیلی چندروزه در حالی که فروشگاه باز است پیش می‌آید؛ بدون این
   * گزینه‌ها فروش روزهای جامانده هرگز ثبت نمی‌شد.
   */
  const options = useMemo(
    () =>
      Array.from({ length: MAX_BACKDATE_DAYS + 1 }, (_, back) => {
        const iso = addDaysIso(today, -back);
        const prefix =
          back === 0 ? 'امروز' : back === 1 ? 'دیروز' : `${back} روز پیش`;

        return { iso, label: `${prefix} — ${formatJalaliLong(iso)}` };
      }),
    [today],
  );

  // صندوق دوروزه روز بعدی می‌خواهد، پس از امروز شروع نمی‌شود.
  const twoDayAvailable = businessDate !== today;
  const twoDayActive = isTwoDay && twoDayAvailable;
  const coversUntil = twoDayActive ? addDaysIso(businessDate, 1) : null;

  function select(iso: string): void {
    setBusinessDate(iso);
    // انتخاب امروز، حالت دوروزه را بی‌معنا می‌کند.
    if (iso === today) setTwoDay(false);
  }

  return {
    options,
    businessDate,
    select,
    isTwoDay,
    setTwoDay,
    twoDayAvailable,
    twoDayActive,
    coversUntil,
  };
}
