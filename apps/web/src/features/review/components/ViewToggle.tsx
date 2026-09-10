interface Props {
  value: 'list' | 'matrix';
  onChange: (value: 'list' | 'matrix') => void;
}

const OPTIONS = [
  { value: 'list' as const, label: 'فهرست' },
  { value: 'matrix' as const, label: 'جدول مقایسه' },
];

/** انتخاب نمای صفحهٔ بررسی. */
export function ViewToggle({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="نمای نمایش"
      className="flex overflow-hidden rounded-lg border border-border"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={[
            'px-3.5 py-1.5 text-sm transition-colors',
            value === option.value
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted hover:bg-surface-muted',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
