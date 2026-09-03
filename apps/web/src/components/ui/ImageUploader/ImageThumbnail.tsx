import { SignedImage } from './SignedImage';
import type { UploadedImage } from './types';

interface Props {
  image: UploadedImage;
  readOnly: boolean;
  onOpen: () => void;
  onRemove: () => void;
}

/** پیش‌نمایش یک تصویر با دکمهٔ حذف. */
export function ImageThumbnail({ image, readOnly, onOpen, onRemove }: Props) {
  return (
    <figure className="group relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`بزرگ‌نمایی ${image.originalName}`}
        className="block size-16 overflow-hidden rounded border border-border focus-visible:ring-2 focus-visible:ring-primary"
      >
        <SignedImage
          uploadId={image.id}
          alt={image.originalName}
          className="size-full object-cover"
        />
      </button>

      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`حذف ${image.originalName}`}
          className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-shortage text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="size-2.5"
            aria-hidden
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </figure>
  );
}
