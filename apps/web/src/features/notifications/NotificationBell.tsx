import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { formatJalali } from '@cashclose/shared';

import { api } from '../../lib/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  cashRegisterId: string | null;
  createdAt: string;
}

/**
 * آیکون اعلان در نوار بالا (بند ۸.۱ سند).
 *
 * شمار خوانده‌نشده‌ها هر ۶۰ ثانیه تازه می‌شود (Polling ساده). WebSocket
 * برای این حجم اعلان توجیه ندارد.
 */
export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const unread = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 60_000,
  });

  const list = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () =>
      api.get<{ items: Notification[] }>('/notifications', { limit: 10 }),
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch<{ count: number }>('/notifications/read-all'),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const count = unread.data?.count ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          count > 0
            ? `${count.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
            : 'اعلان‌ها'
        }
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-[18px]"
          aria-hidden
        >
          <path d="M8 2a4 4 0 00-4 4v3l-1 2h10l-1-2V6a4 4 0 00-4-4zM6.5 13a1.5 1.5 0 003 0" />
        </svg>

        {count > 0 && (
          <span className="absolute -left-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-shortage px-1 text-[10px] font-semibold text-white">
            {count.toLocaleString('fa-IR')}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* پوششی برای بستن با کلیک بیرون. */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div className="absolute left-0 top-11 z-40 w-80 rounded-lg border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold text-text">اعلان‌ها</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-primary hover:underline"
                >
                  خواندن همه
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {list.isPending && (
                <p className="p-4 text-sm text-text-muted">در حال بارگذاری…</p>
              )}

              {list.data?.items.length === 0 && (
                <p className="p-6 text-center text-sm text-text-muted">
                  اعلانی وجود ندارد.
                </p>
              )}

              {list.data?.items.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-border px-4 py-3 last:border-0 ${
                    item.isRead ? '' : 'bg-primary-soft/30'
                  }`}
                >
                  <p className="text-sm text-text">{item.message}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatJalali(item.createdAt.slice(0, 10))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
