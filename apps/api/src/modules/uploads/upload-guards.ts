import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import type { PrismaService } from '../../common/prisma/prisma.service';
import type { RequestUser } from '../../common/tenant/request-user';
import { isEditable } from '../cash-registers/cash-register.rules';

/**
 * بررسی‌های مشترک پیش از تغییر تصاویر.
 *
 * جدا از سرویس نگه داشته شده تا هر دو مسیر افزودن و حذف از یک منطق
 * استفاده کنند و امکان واگرایی نداشته باشند.
 */

/** بارگذاری تراکنش با بررسی مالکیت و قابلیت ویرایش. */
export async function loadEditableTransaction(
  prisma: PrismaService,
  actor: RequestUser,
  transactionId: string,
) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, tenantId: actor.tenantId },
    select: {
      id: true,
      cashRegisterId: true,
      cashRegister: { select: { cashierId: true, status: true } },
    },
  });

  if (!transaction) throw new NotFoundException('تراکنش یافت نشد.');

  if (
    actor.role !== UserRole.cashier ||
    transaction.cashRegister.cashierId !== actor.id
  ) {
    throw new ForbiddenException(
      'تنها صندوقدارِ صاحب این صندوق می‌تواند تصویر اضافه کند.',
    );
  }

  if (!isEditable(transaction.cashRegister.status)) {
    throw new BadRequestException(
      'پس از ارسال صندوق، امکان افزودن تصویر وجود ندارد.',
    );
  }

  return transaction;
}

/** بارگذاری تصویر با بررسی مجوز حذف. */
export async function loadDeletableUpload(
  prisma: PrismaService,
  actor: RequestUser,
  uploadId: string,
) {
  const upload = await prisma.upload.findFirst({
    where: { id: uploadId, tenantId: actor.tenantId },
    select: {
      id: true,
      storageKey: true,
      cashRegister: { select: { cashierId: true, status: true } },
    },
  });

  if (!upload) throw new NotFoundException('تصویر یافت نشد.');

  if (
    actor.role !== UserRole.cashier ||
    upload.cashRegister.cashierId !== actor.id
  ) {
    throw new ForbiddenException('حذف این تصویر مجاز نیست.');
  }

  // پس از ارسال صندوق، تصاویر بخشی از سند حسابرسی‌اند و حذفشان یعنی
  // از بین بردن مدرک (بند ۱۱.۶ و ۱۲.۶ سند).
  if (!isEditable(upload.cashRegister.status)) {
    throw new BadRequestException(
      'امکان حذف تصویر پس از ارسال صندوق وجود ندارد.',
    );
  }

  return upload;
}
