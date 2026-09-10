import { useState } from 'react';

import { AppLayout } from '../components/layout/AppLayout';
import { CellImagesModal } from '../features/review/components/CellImagesModal';
import { MatrixTable } from '../features/review/components/MatrixTable';
import { ReviewFilters } from '../features/review/components/ReviewFilters';
import { ReviewTable } from '../features/review/components/ReviewTable';
import { ViewToggle } from '../features/review/components/ViewToggle';
import {
  useMatrix,
  type CellImage,
} from '../features/review/hooks/useMatrix';
import {
  useRegisterList,
  type RegisterFilters,
} from '../features/review/hooks/useReviewApi';

/**
 * فهرست صندوق‌ها برای بررسی حسابدار.
 *
 * دو نما دارد: فهرست ساده برای کار روزمره، و جدول پهن برای وقتی که
 * حسابدار می‌خواهد چند روز را کنار هم مقایسه کند (بند ۹ سند).
 */
export function ReviewListPage() {
  // پیش‌فرض «در انتظار بررسی» است — کاری که حسابدار برای انجامش می‌آید.
  const [filters, setFilters] = useState<RegisterFilters>({
    status: 'submitted',
  });
  const [view, setView] = useState<'list' | 'matrix'>('list');
  const [images, setImages] = useState<{
    items: CellImage[];
    label: string;
  } | null>(null);

  const registers = useRegisterList(filters);
  const matrix = useMatrix(filters, view === 'matrix');

  return (
    <AppLayout>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold text-text">بررسی صندوق‌ها</h1>
          <p className="text-sm text-text-muted">
            {registers.data?.totalItems?.toLocaleString('fa-IR') ?? '۰'} صندوق
          </p>
        </div>

        <ViewToggle value={view} onChange={setView} />
      </div>

      <ReviewFilters filters={filters} onChange={setFilters} />

      {view === 'list' ? (
        <ReviewTable query={registers} />
      ) : (
        <MatrixTable
          rows={matrix.data ?? []}
          onOpenImages={(items, label) => setImages({ items, label })}
        />
      )}

      {images && (
        <CellImagesModal
          images={images.items}
          label={images.label}
          onClose={() => setImages(null)}
        />
      )}
    </AppLayout>
  );
}
