import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../common/storage/storage.interface';
import type { RequestUser } from '../../common/tenant/request-user';
import { UploadTokenService } from './upload-token.service';

/**
 * دسترسی خواندنی به تصاویر.
 *
 * جدا از سرویس آپلود نگه داشته شده چون منطق متفاوتی دارد: اینجا با
 * امضای کوتاه‌مدت کار می‌کنیم، نه با توکن نشست.
 */
@Injectable()
export class UploadAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: UploadTokenService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /**
   * بررسی حق دیدن تصویر.
   *
   * صندوقدار فقط تصاویر صندوق خودش را می‌بیند؛ بقیهٔ نقش‌ها برای بررسی
   * و گزارش به همهٔ تصاویر مستأجر دسترسی دارند.
   */
  async assertCanView(actor: RequestUser, uploadId: string) {
    const upload = await this.prisma.upload.findFirst({
      where: { id: uploadId, tenantId: actor.tenantId },
      select: { id: true, cashRegister: { select: { cashierId: true } } },
    });

    if (!upload) throw new NotFoundException('تصویر یافت نشد.');

    if (
      actor.role === UserRole.cashier &&
      upload.cashRegister.cashierId !== actor.id
    ) {
      throw new ForbiddenException('دسترسی به این تصویر مجاز نیست.');
    }

    return upload;
  }

  /**
   * خواندن محتوای تصویر با امضای کوتاه‌مدت.
   *
   * تگ `<img>` هدر Authorization نمی‌فرستد، پس دسترسی با امضایی انجام
   * می‌شود که پیش‌تر برای همین کاربر و همین تصویر صادر شده است.
   */
  async getContentBySignature(uploadId: string, token: string) {
    const userId = this.tokens.verify(token, uploadId);

    if (!userId) {
      throw new ForbiddenException('لینک تصویر نامعتبر یا منقضی شده است.');
    }

    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      select: {
        storageKey: true,
        mimeType: true,
        originalName: true,
        tenantId: true,
        cashRegister: { select: { cashierId: true } },
      },
    });

    if (!upload) throw new NotFoundException('تصویر یافت نشد.');

    // امضا معتبر است، ولی دسترسی کاربر دوباره از دیتابیس بررسی می‌شود:
    // ممکن است از زمان صدور لینک، کاربر غیرفعال یا نقشش عوض شده باشد.
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'active' },
      select: { id: true, role: true, tenantId: true },
    });

    if (!user || user.tenantId !== upload.tenantId) {
      throw new ForbiddenException('دسترسی به این تصویر مجاز نیست.');
    }

    if (
      user.role === UserRole.cashier &&
      upload.cashRegister.cashierId !== user.id
    ) {
      throw new ForbiddenException('دسترسی به این تصویر مجاز نیست.');
    }

    return {
      buffer: await this.storage.read(upload.storageKey),
      mimeType: upload.mimeType,
      originalName: upload.originalName,
    };
  }
}
