import clsx from 'clsx';

import { useImageLink } from './useImageLink';

interface Props {
  uploadId: string;
  alt: string;
  className?: string;
}

/**
 * تصویری که آدرسش با امضای کوتاه‌مدت گرفته می‌شود.
 *
 * تا آماده‌شدن لینک، یک جای‌گیر نشان داده می‌شود تا چیدمان نپرد.
 */
export function SignedImage({ uploadId, alt, className }: Props) {
  const link = useImageLink(uploadId);

  if (link.isPending) {
    return (
      <div
        className={clsx('animate-pulse bg-surface-muted', className)}
        aria-label="در حال بارگذاری تصویر"
      />
    );
  }

  if (link.isError || !link.data) {
    return (
      <div
        className={clsx(
          'grid place-items-center bg-surface-muted text-xs text-text-muted',
          className,
        )}
        title="بارگذاری تصویر ناموفق بود"
      >
        ✕
      </div>
    );
  }

  return (
    <img src={link.data.url} alt={alt} loading="lazy" className={className} />
  );
}
