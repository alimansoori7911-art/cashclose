import type { MissingItem } from '@cashclose/shared';

import { Alert } from '../../../components/ui/Alert/index';
import { Button } from '../../../components/ui/Button/index';
import { Modal } from '../../../components/ui/Modal/index';
import type { FormRow } from '../hooks/useRegisterForm';
import { findRowKey } from '../hooks/useCompleteness';

interface Props {
  open: boolean;
  onClose: () => void;
  missing: MissingItem[];
  rows: FormRow[];
  closing: boolean;
  onUpdate: (key: string, patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onConfirm: () => void;
}

/**
 * گرفتن دلیلِ نبودِ اقلام اجباری، پیش از بستن صندوق.
 *
 * چرا مدال و نه پیام کنار هر فیلد: صندوقدار ساعت پایانی شب نباید در
 * فرم ۲۲ قلمی دنبال بگردد کدام ردیف ناقص است. مدال همه را یکجا نشان
 * می‌دهد و در همان‌جا قابل تکمیل است.
 */
export function CompletenessModal({
  open,
  onClose,
  missing,
  rows,
  closing,
  onUpdate,
  onConfirm,
}: Props) {
  const blocking = missing.filter((item) => item.missingDescription);
  const canClose = blocking.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="اقلام اجباری ناقص"
      size="wide"
    >
      <Alert tone="warning" className="mb-4">
        این اقلام طبق قواعد فروشگاه عکس یا توضیح اجباری دارند. اگر عکس
        ندارید، بنویسید چرا — همین توضیح برای حسابدار ثبت می‌شود.
      </Alert>

      <div className="flex flex-col gap-3">
        {missing.map((item) => {
          const key = findRowKey(rows, item.type);
          const row = rows.find((r) => r.key === key);

          return (
            <div
              key={item.type}
              className="rounded-lg border border-border bg-bg p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-text">
                  {item.label}
                </span>

                {/* رنگ تنها حامل معنا نیست: متن وضعیت هم می‌آید. */}
                <span
                  className={`text-xs ${
                    item.missingDescription ? 'text-warning' : 'text-text-muted'
                  }`}
                >
                  {item.missingImages ? 'عکس ندارد' : 'توضیح ندارد'}
                </span>
              </div>

              {key && row && (
                <textarea
                  value={row.description}
                  rows={2}
                  maxLength={300}
                  onChange={(event) =>
                    onUpdate(key, { description: event.target.value })
                  }
                  placeholder={
                    item.missingImages
                      ? 'چرا عکس بارگذاری نشد؟'
                      : 'توضیح این قلم را بنویسید'
                  }
                  aria-label={`توضیح ${item.label}`}
                  className="w-full resize-y rounded border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-text-muted">
          {canClose
            ? 'همهٔ موارد توضیح دارند؛ صندوق قابل بستن است.'
            : `${blocking.length.toLocaleString('fa-IR')} مورد هنوز توضیح ندارد.`}
        </span>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={closing}>
            بازگشت به فرم
          </Button>
          <Button onClick={onConfirm} loading={closing} disabled={!canClose}>
            بستن صندوق
          </Button>
        </div>
      </div>
    </Modal>
  );
}
