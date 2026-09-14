interface Props {
  isActive: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  /** برچسب دکمهٔ غیرفعال‌سازی؛ پیش‌فرض برای شعبه و دستگاه یکسان است. */
  deactivateLabel?: string;
}

/**
 * دکمه‌های ویرایش و غیرفعال‌سازی یک ردیف جدول مدیریت.
 *
 * بین شعبه‌ها و کارتخوان‌ها مشترک است؛ قواعد دسترسی متفاوتِ کاربران،
 * `UserActions` جداگانهٔ خودش را دارد.
 */
export function RowActions({
  isActive,
  onEdit,
  onDeactivate,
  deactivateLabel = 'غیرفعال‌سازی',
}: Props) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="rounded px-2 py-1 text-sm text-primary transition-colors hover:bg-primary-soft"
      >
        ویرایش
      </button>

      {/* موردی که از قبل غیرفعال است، دکمهٔ غیرفعال‌سازی نمی‌خواهد. */}
      {isActive && (
        <button
          type="button"
          onClick={onDeactivate}
          className="rounded px-2 py-1 text-sm text-shortage transition-colors hover:bg-shortage-soft"
        >
          {deactivateLabel}
        </button>
      )}
    </div>
  );
}
