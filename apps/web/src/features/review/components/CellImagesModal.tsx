import { useState } from 'react';

import { ImageLightbox } from '../../../components/ui/ImageUploader/ImageLightbox';
import { ImageThumbnail } from '../../../components/ui/ImageUploader/ImageThumbnail';
import { Modal } from '../../../components/ui/Modal/index';
import type { CellImage } from '../hooks/useMatrix';

interface Props {
  images: CellImage[];
  label: string;
  onClose: () => void;
}

/**
 * تصاویر یک خانهٔ جدول (بند ۹ سند).
 *
 * ابتدا بندانگشتی‌ها می‌آیند و کلیک روی هرکدام نمای بزرگ را باز می‌کند —
 * برای قلمی مثل کارتخوان که چند دستگاه و چند رسید دارد، پریدن مستقیم
 * به نمای بزرگ یعنی حسابدار نمی‌فهمد چند تصویر هست.
 */
export function CellImagesModal({ images, label, onClose }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <Modal open onClose={onClose} title={`تصاویر ${label}`} size="wide">
        <p className="mb-3 text-sm text-text-muted">
          {images.length.toLocaleString('fa-IR')} تصویر
        </p>

        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <ImageThumbnail
              key={image.id}
              image={image}
              readOnly
              onOpen={() => setLightboxIndex(index)}
              onRemove={() => undefined}
            />
          ))}
        </div>
      </Modal>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
