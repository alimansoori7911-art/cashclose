import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // دادهٔ صندوق در بازهٔ کوتاه تغییر نمی‌کند؛ درخواست تکراری هنگام
      // جابه‌جایی بین تب‌ها فایده‌ای ندارد.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // طبق بند ۱۳.۳ سند: سه بار تلاش مجدد در خطای شبکه.
      retry: 3,
    },
  },
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('عنصر ریشه (#root) در صفحه پیدا نشد.');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
