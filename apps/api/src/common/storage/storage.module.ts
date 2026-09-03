import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER } from './storage.interface';

/**
 * ماژول ذخیره‌سازی.
 *
 * انتخاب Provider اینجا و فقط اینجا انجام می‌شود؛ افزودن S3 در آینده
 * یعنی یک کلاس جدید و یک شاخهٔ دیگر در همین factory.
 */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('STORAGE_DRIVER', 'local');

        if (driver === 'local') {
          return new LocalStorageProvider(config);
        }

        throw new Error(
          `درایور ذخیره‌سازی «${driver}» هنوز پیاده‌سازی نشده است.`,
        );
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
