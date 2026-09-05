import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../common/prisma/prisma.service';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../common/storage/storage.interface';
import type { RequestUser } from '../../common/tenant/request-user';
import { AuditService } from '../audit/audit.service';
import { validateImage } from './image-validator';
import {
  loadDeletableUpload,
  loadEditableTransaction,
} from './upload-guards';

export interface UploadedFile {
  buffer: Buffer;
  size: number;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class UploadsService {
  private readonly maxSizeBytes: number;
  private readonly maxPerSection: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    config: ConfigService,
  ) {
    this.maxSizeBytes =
      config.get<number>('UPLOAD_MAX_FILE_SIZE_MB', 3) * 1024 * 1024;
    this.maxPerSection = config.get<number>(
      'UPLOAD_MAX_FILES_PER_SECTION',
      5,
    );
  }

  /**
   * آپلود تصویر برای یک تراکنش.
   *
   * ترتیب کار مهم است: اول همهٔ بررسی‌ها، بعد نوشتن روی دیسک، و در
   * آخر ثبت در دیتابیس. اگر ثبت دیتابیس شکست بخورد، فایل یتیم پاک
   * می‌شود تا دیسک از فایل‌های بی‌مرجع پر نشود.
   */
  async uploadForTransaction(
    actor: RequestUser,
    transactionId: string,
    file: UploadedFile,
  ) {
    const transaction = await loadEditableTransaction(
      this.prisma,
      actor,
      transactionId,
    );

    const existing = await this.prisma.upload.count({ where: { transactionId } });
    if (existing >= this.maxPerSection) {
      throw new BadRequestException(
        `برای هر بخش حداکثر ${this.maxPerSection.toLocaleString('fa-IR')} تصویر مجاز است.`,
      );
    }

    const { mimeType } = validateImage(file, {
      maxSizeBytes: this.maxSizeBytes,
    });

    const stored = await this.storage.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType,
      scope: actor.tenantId,
    });

    try {
      const upload = await this.prisma.upload.create({
        data: {
          tenantId: actor.tenantId,
          cashRegisterId: transaction.cashRegisterId,
          transactionId,
          storageKey: stored.key,
          originalName: file.originalname.slice(0, 255),
          mimeType,
          sizeBytes: stored.sizeBytes,
        },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      });

      await this.audit.record({
        tenantId: actor.tenantId,
        userId: actor.id,
        action: 'image_uploaded',
        entityType: 'upload',
        entityId: upload.id,
        meta: { transactionId, sizeBytes: stored.sizeBytes },
      });

      return upload;
    } catch (error) {
      await this.storage.delete(stored.key);
      throw error;
    }
  }

  /** حذف تصویر — فقط در حالت پیش‌نویس. */
  async remove(actor: RequestUser, uploadId: string) {
    const upload = await loadDeletableUpload(this.prisma, actor, uploadId);

    await this.prisma.upload.delete({ where: { id: uploadId } });
    await this.storage.delete(upload.storageKey);

    await this.audit.record({
      tenantId: actor.tenantId,
      userId: actor.id,
      action: 'image_deleted',
      entityType: 'upload',
      entityId: uploadId,
    });

    return { message: 'تصویر حذف شد.' };
  }

}
