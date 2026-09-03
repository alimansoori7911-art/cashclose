import { useEffect } from 'react';

import { formatFileSize } from '../../../lib/image-compression';
import { SignedImage } from './SignedImage';
import type { UploadedImage } from './types';

interface Props {
  images: UploadedImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * نمایش بزرگ تصویر با امکان جابه‌جایی (بند ۸.۳ سند).
 *
 * جهت کلیدها در چیدمان راست‌به‌چپ برعکس است: کلید «چپ» به تصویر بعدی
 * می‌رود، چون در RTL حرکت طبیعی رو به چپ است.
 */
export function ImageLightbox({ images, index, onClose, onNavigate }: Props) {
  const image = images[index];

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft' && index < images.length - 1) {
        onNavigate(index + 1);
      }
      if (event.key === 'ArrowRight' && index > 0) {
        onNavigate(index - 1);
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, images.length, onClose, onNavigate]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.originalName}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 p-6"
    >
      <div onClick={(event) => event.stopPropagation()}>
        <SignedImage
          uploadId={image.id}
          alt={image.originalName}
          className="max-h-[75vh] max-w-full rounded object-contain"
        />
      </div>

      <div
        onClick={(event) => event.stopPropagation()}
        className="flex items-center gap-4 rounded-lg bg-black/60 px-4 py-2 text-sm text-white"
      >
        <button
          type="button"
          onClick={() => onNavigate(index - 1)}
          disabled={index === 0}
          aria-label="تصویر قبلی"
          className="disabled:opacity-30"
        >
          ›
        </button>

        <span>
          {(index + 1).toLocaleString('fa-IR')} از{' '}
          {images.length.toLocaleString('fa-IR')}
          <span className="mr-2 opacity-70">
            ({formatFileSize(image.sizeBytes)})
          </span>
        </span>

        <button
          type="button"
          onClick={() => onNavigate(index + 1)}
          disabled={index === images.length - 1}
          aria-label="تصویر بعدی"
          className="disabled:opacity-30"
        >
          ‹
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="بستن"
        className="absolute left-5 top-5 grid size-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
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
  );
}
