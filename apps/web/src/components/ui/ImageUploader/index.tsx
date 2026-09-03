import { useRef, useState, type DragEvent } from 'react';

import { Alert } from '../Alert/index';
import { ImageLightbox } from './ImageLightbox';
import { ImageThumbnail } from './ImageThumbnail';
import type { UploadedImage } from './types';
import { useImageUpload } from './useImageUpload';

interface Props {
  transactionId: string | null;
  images: UploadedImage[];
  max?: number;
  readOnly?: boolean;
  label?: string;
}

/**
 * آپلود چندعکسی با پیش‌نمایش (بند ۸.۳ سند).
 *
 * پشتیبانی از کشیدن‌ورها‌کردن و انتخاب چندتایی؛ حذف فقط وقتی صندوق
 * هنوز باز است.
 */
export function ImageUploader({
  transactionId,
  images,
  max = 5,
  readOnly = false,
  label = 'تصاویر',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { uploadFiles, removeImage, uploading, progress, error } =
    useImageUpload(transactionId, max);

  const canAdd = !readOnly && images.length < max && Boolean(transactionId);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (!canAdd) return;

    void uploadFiles(Array.from(event.dataTransfer.files), images.length);
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        {images.map((image, index) => (
          <ImageThumbnail
            key={image.id}
            image={image}
            readOnly={readOnly}
            onOpen={() => setLightboxIndex(index)}
            onRemove={() => void removeImage(image.id)}
          />
        ))}

        {canAdd && (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={[
              'grid size-16 place-items-center rounded border-2 border-dashed transition-colors',
              dragOver
                ? 'border-primary bg-primary-soft'
                : 'border-border hover:border-primary',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-label={`افزودن ${label}`}
              className="grid size-full place-items-center text-text-muted hover:text-primary"
            >
              {uploading ? (
                <span className="text-[10px]">
                  {progress.done.toLocaleString('fa-IR')}/
                  {progress.total.toLocaleString('fa-IR')}
                </span>
              ) : (
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="size-5"
                  aria-hidden
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <p className="text-xs text-text-muted">
          {images.length.toLocaleString('fa-IR')} از{' '}
          {max.toLocaleString('fa-IR')} تصویر
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          // پاک‌کردن مقدار تا انتخاب دوبارهٔ همان فایل هم رویداد بدهد.
          event.target.value = '';
          void uploadFiles(files, images.length);
        }}
      />

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}

export type { UploadedImage };
