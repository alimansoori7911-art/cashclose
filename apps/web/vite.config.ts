import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
// از vitest وارد می‌شود تا بلوک `test` هم تایپ داشته باشد.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // درخواست‌های /api به بک‌اند پراکسی می‌شوند تا در توسعه با CORS
    // درگیر نشویم و مسیرها با محیط تولید یکسان بمانند.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
