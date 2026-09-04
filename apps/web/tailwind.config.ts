import type { Config } from 'tailwindcss';

/**
 * توکن‌های طراحی از متغیرهای CSS خوانده می‌شوند (نه مقادیر ثابت) تا
 * حالت تیره فقط با عوض‌شدن یک کلاس روی <html> کار کند و نیازی به
 * تعریف دوبارهٔ هر رنگ در پیکربندی نباشد.
 *
 * قالب `rgb(var(--x) / <alpha-value>)` باعث می‌شود کلاس‌هایی مثل
 * `bg-primary/10` هم درست کار کنند.
 */
function token(variable: string): string {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  /*
   * رنگ‌ها از متغیرهای CSS می‌آیند و خودِ متغیرها هم با media query و
   * هم با کلاس عوض می‌شوند، پس اینجا فقط انتخاب صریح کاربر مهم است.
   */
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('--color-bg'),
        surface: {
          DEFAULT: token('--color-surface'),
          muted: token('--color-surface-muted'),
        },
        border: token('--color-border'),
        text: {
          DEFAULT: token('--color-text'),
          muted: token('--color-text-muted'),
          inverse: token('--color-text-inverse'),
        },
        primary: {
          DEFAULT: token('--color-primary'),
          hover: token('--color-primary-hover'),
          soft: token('--color-primary-soft'),
        },
        balanced: {
          DEFAULT: token('--color-balanced'),
          soft: token('--color-balanced-soft'),
        },
        surplus: {
          DEFAULT: token('--color-surplus'),
          soft: token('--color-surplus-soft'),
        },
        shortage: {
          DEFAULT: token('--color-shortage'),
          soft: token('--color-shortage-soft'),
        },
        warning: {
          DEFAULT: token('--color-warning'),
          soft: token('--color-warning-soft'),
        },
        chart: {
          DEFAULT: token('--color-chart'),
          soft: token('--color-chart-soft'),
          grid: token('--color-chart-grid'),
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'calc(var(--radius) + 0.25rem)',
      },
      fontFamily: {
        sans: ['Vazirmatn Variable', 'Vazirmatn', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
