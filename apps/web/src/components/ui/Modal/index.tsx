import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * مدال با رفتار دسترس‌پذیر.
 *
 * از `<dialog>` بومی استفاده می‌شود چون مدیریت فوکوس، بستن با Escape و
 * لایهٔ بالای صفحه را خود مرورگر درست انجام می‌دهد — پیاده‌سازی دستی
 * این‌ها معمولاً ناقص از آب درمی‌آید.
 */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** بستن با کلیک بیرون؛ برای فرم‌های نیمه‌پرشده بهتر است خاموش باشد. */
  closeOnBackdrop?: boolean;
  /** `wide` برای محتوای جدولی مثل فهرست دستگاه‌ها. */
  size?: 'default' | 'wide';
}

export function Modal({
  open,
  onClose,
  title,
  children,
  closeOnBackdrop = false,
  size = 'default',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // شناسهٔ یکتا لازم است: اگر دو مدال همزمان در درخت باشند، شناسهٔ ثابت
  // تکراری می‌شود و aria-labelledby به عنوان اشتباه اشاره می‌کند.
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // کلید Escape را خود <dialog> مدیریت می‌کند؛ فقط باید state بیرونی
    // را هم‌گام نگه داریم.
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={(event) => {
        // کلیک روی خودِ dialog یعنی پس‌زمینه؛ کلیک روی محتوا به اینجا
        // نمی‌رسد چون داخل یک عنصر فرزند است.
        if (closeOnBackdrop && event.target === ref.current) onClose();
      }}
      className={[
        size === 'wide'
          ? 'w-[min(46rem,calc(100vw-2rem))]'
          : 'w-[min(32rem,calc(100vw-2rem))]',
        'rounded-lg border border-border',
        'bg-surface p-0 text-text shadow-xl backdrop:bg-black/40',
        'open:animate-in',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 id={titleId} className="font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="grid size-8 place-items-center rounded text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="size-4"
            aria-hidden
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div className="p-5">{children}</div>
    </dialog>
  );
}
