interface Props {
  count: number;
  expanded: boolean;
  hasValue: boolean;
  onToggle: () => void;
}

/** بازکنندهٔ اقلام کم‌کاربرد یک ستون. */
export function SecondaryToggle({
  count,
  expanded,
  hasValue,
  onToggle,
}: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center gap-2 rounded-lg bg-surface-muted px-3 py-2.5 text-right transition-colors hover:bg-border"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={[
          'size-4 shrink-0 text-text-muted transition-transform',
          expanded ? 'rotate-180' : '',
        ].join(' ')}
        aria-hidden
      >
        <path d="M4 6l4 4 4-4" />
      </svg>

      <span className="text-sm text-text-muted">
        {count.toLocaleString('fa-IR')} قلم دیگر
      </span>

      {/* نشان «دارای مبلغ» دلیل بازماندن خودکار را توضیح می‌دهد. */}
      {hasValue && (
        <span className="mr-auto text-xs text-primary">دارای مبلغ</span>
      )}
    </button>
  );
}
