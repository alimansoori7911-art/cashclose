import {
  formatMoney,
  type ProcessCheck,
  type TransactionType,
} from '@cashclose/shared';

import type {
  AnomalyHint,
  TypeHint,
} from '../hooks/useDifferenceHelp';

interface Props {
  difference: number;
  suggestions: TypeHint[];
  anomalies: AnomalyHint[];
  processChecks: ProcessCheck[];
  onAddRow: (type: TransactionType) => void;
}

/**
 * راهنمای رفع اختلاف.
 *
 * صندوقدار نباید خودش دنبال خطا بگردد. سه سطح کمک می‌گیرد و هیچ‌کدام
 * حدس نیست: اقلام مرتبط با جهت اختلاف (از ریاضی معادله)، تفاوت با صندوق
 * قبلی (واقعیت ثبت‌شده)، و راه خروج آبرومندانه اگر اختلاف واقعی باشد.
 */
export function DifferenceHelp({
  difference,
  suggestions,
  anomalies,
  processChecks,
  onAddRow,
}: Props) {
  if (difference === 0) return null;

  const isShortage = difference < 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-shortage/40 bg-surface p-4">
        <p className="mb-3 text-sm text-text">
          {isShortage
            ? 'پولی که شمرده‌اید کمتر از فروش سیستم است. معمولاً یکی از این‌هاست:'
            : 'پولی که شمرده‌اید بیشتر از فروش سیستم است. معمولاً یکی از این‌هاست:'}
        </p>

        <div className="flex flex-col gap-1.5">
          {suggestions.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddRow(item.type)}
              className="flex items-center gap-3 rounded-lg bg-bg p-2.5 text-right transition-colors hover:bg-surface-muted"
            >
              <span className="flex-1">
                <span className="block text-sm text-text">{item.label}</span>
                <span className="block text-xs text-text-muted">
                  {item.hint}
                </span>
              </span>
              <span className="shrink-0 text-xs text-primary">افزودن</span>
            </button>
          ))}
        </div>
      </div>

      {(anomalies.length > 0 || processChecks.length > 0) && (
        <div className="rounded-lg border border-warning/40 bg-surface p-4">
          <p className="mb-2 text-sm font-medium text-text">بررسی کنید</p>
          <ul className="flex flex-col gap-2">
            {processChecks.map((check) => (
              <li key={check.title} className="text-xs">
                <span className="block text-text">{check.title}</span>
                <span className="block text-text-muted">{check.detail}</span>
              </li>
            ))}
            {anomalies.map((item) => (
              <li key={item.label} className="text-xs text-text-muted">
                <span className="text-text">{item.label}</span> {item.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg bg-surface-muted p-3.5">
        <p className="text-xs text-text-muted">
          اگر واقعاً {isShortage ? 'کسری' : 'مازاد'} دارید، قلم «
          {isShortage ? 'کسری صندوق' : 'مازاد صندوق'}» را با مبلغ{' '}
          <span className="financial-figure text-text">
            {formatMoney(Math.abs(difference))}
          </span>{' '}
          و توضیح دلیلش ثبت کنید تا صندوق بسته شود. مدیر آن را در گزارش
          می‌بیند.
        </p>
      </div>
    </div>
  );
}
