import { formatRial, type CashCalculationResult } from '@cashclose/shared';

import { Button } from '../../../components/ui/Button/index';
import { CashStatusBadge } from '../../../components/ui/StatusBadge/index';

interface Props {
  calculation: CashCalculationResult;
  readOnly: boolean;
  saving: boolean;
  closing: boolean;
  onSaveDraft: () => void;
  onClose: () => void;
}

/**
 * نوار خلاصهٔ چسبان.
 *
 * تنها عددی که صندوقدار مدام نگاهش می‌کند «اختلاف» است، پس همیشه در
 * دید می‌ماند. دکمهٔ بستن تا صفرشدن اختلاف غیرفعال است — همان قاعده‌ای
 * که بک‌اند هم مستقل اعمال می‌کند.
 */
export function SummaryBar({
  calculation,
  readOnly,
  saving,
  closing,
  onSaveDraft,
  onClose,
}: Props) {
  const { registerBalance, documentsTotal, difference, canClose } = calculation;

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-surface shadow-[0_-4px_16px_rgba(15,23,42,0.07)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex flex-col">
            <dt className="text-xs text-text-muted">مانده صندوق</dt>
            <dd className="financial-figure text-sm font-semibold text-text">
              {formatRial(registerBalance)}
            </dd>
          </div>

          <div className="h-8 w-px bg-border" aria-hidden />

          <div className="flex flex-col">
            <dt className="text-xs text-text-muted">جمع اسناد</dt>
            <dd className="financial-figure text-sm font-semibold text-text">
              {formatRial(documentsTotal)}
            </dd>
          </div>

          <div className="h-8 w-px bg-border" aria-hidden />

          <div className="flex flex-col">
            <dt className="text-xs text-text-muted">اختلاف</dt>
            <dd className="flex items-center gap-2.5">
              <span
                className={[
                  'financial-figure text-base font-bold',
                  canClose
                    ? 'text-balanced'
                    : difference > 0n
                      ? 'text-surplus'
                      : 'text-shortage',
                ].join(' ')}
              >
                {formatRial(difference)}
              </span>
              <CashStatusBadge status={calculation.status} />
            </dd>
          </div>
        </dl>

        {!readOnly && (
          <div className="flex items-center gap-2.5">
            {!canClose && (
              <span className="text-xs text-warning">
                بستن صندوق تا صفرشدن اختلاف مجاز نیست
              </span>
            )}
            <Button
              variant="ghost"
              onClick={onSaveDraft}
              loading={saving}
              disabled={closing}
            >
              ذخیرهٔ پیش‌نویس
            </Button>
            <Button
              onClick={onClose}
              loading={closing}
              disabled={!canClose || saving}
            >
              بستن صندوق
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
