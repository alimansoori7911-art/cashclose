/**
 * پیش‌بینی فروش ماهانه (بند ۷ سمت مالک در سند).
 *
 * فرمول دقیقاً همان چیزی است که سند خواسته:
 *   میانگین روزانه = جمع فروش تا امروز ÷ تعداد روزهای سپری‌شده
 *   پیش‌بینی ماه   = میانگین روزانه × تعداد کل روزهای ماه
 *
 * مثال سند: «امروز ۱۳ام ماه است، جمع فروش تا ۱۳ام تقسیم بر ۱۳ می‌شود تا
 * متوسط روزانه دربیاید، بعد پیش‌بینی می‌کند تا پایان ماه چقدر می‌شود».
 *
 * جدا از سرویس نگه داشته شده تا بدون دیتابیس تست شود.
 */

export interface ForecastInput {
  /** جمع فروش تحقق‌یافته تا امروز (ریال). */
  readonly salesToDate: bigint;
  /** تعداد روزهای سپری‌شده از ماه (شامل امروز). */
  readonly daysElapsed: number;
  /** تعداد کل روزهای این ماه شمسی. */
  readonly daysInMonth: number;
}

export interface ForecastResult {
  readonly salesToDate: bigint;
  readonly dailyAverage: bigint;
  readonly projectedTotal: bigint;
  readonly daysElapsed: number;
  readonly daysInMonth: number;
  readonly daysRemaining: number;
  /** آیا ماه تمام شده و عدد دیگر پیش‌بینی نیست؟ */
  readonly isComplete: boolean;
}

export function forecastMonthlySales(input: ForecastInput): ForecastResult {
  const { salesToDate, daysInMonth } = input;

  // روزهای سپری‌شده هرگز نمی‌تواند از طول ماه بیشتر یا از صفر کمتر باشد.
  const daysElapsed = Math.max(0, Math.min(input.daysElapsed, daysInMonth));
  const daysRemaining = daysInMonth - daysElapsed;

  if (daysElapsed === 0) {
    // هنوز روزی نگذشته: میانگین تعریف‌نشده است و پیش‌بینی معنا ندارد.
    return {
      salesToDate,
      dailyAverage: 0n,
      projectedTotal: 0n,
      daysElapsed: 0,
      daysInMonth,
      daysRemaining,
      isComplete: false,
    };
  }

  // تقسیم صحیح bigint باقی‌مانده را دور می‌ریزد؛ برای مبالغ ریالی که
  // میلیونی‌اند، این خطا ناچیز و بی‌اثر است.
  const dailyAverage = salesToDate / BigInt(daysElapsed);

  return {
    salesToDate,
    dailyAverage,
    projectedTotal: dailyAverage * BigInt(daysInMonth),
    daysElapsed,
    daysInMonth,
    daysRemaining,
    isComplete: daysRemaining === 0,
  };
}

/**
 * نرخ رشد نسبت به سال قبل (بند ۸ سند).
 *
 * خروجی درصد است؛ `null` یعنی سال قبل داده‌ای نداشته و نسبت‌گیری ممکن
 * نیست — بهتر از نمایش «۱۰۰٪ رشد» که گمراه‌کننده است.
 */
export function growthRate(
  current: bigint,
  previous: bigint,
): number | null {
  if (previous === 0n) return null;

  // تبدیل به Number فقط برای محاسبهٔ درصد؛ نسبت دو عدد بزرگ همیشه در
  // محدودهٔ امن قرار می‌گیرد.
  const ratio = Number(current) / Number(previous);
  return Math.round((ratio - 1) * 1000) / 10;
}
