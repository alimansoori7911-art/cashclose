import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import type {
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/password-reset.dto';
import { PasswordService } from './password.service';

export interface ForgotPasswordResult {
  message: string;
  /**
   * فقط در محیط غیرتولیدی پر می‌شود.
   * ⚠️ اتصال واقعی ایمیل/پیامک هنوز انجام نشده — در فاز استقرار باید
   * یک Provider واقعی جای این مقدار را بگیرد.
   */
  devToken?: string;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly ttlMinutes: number;
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.ttlMinutes = config.get<number>('PASSWORD_RESET_TTL_MINUTES', 30);
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
  }

  /**
   * درخواست بازیابی رمز.
   *
   * پاسخ همیشه یکسان است — چه کاربر وجود داشته باشد چه نه — تا نتوان با
   * این مسیر فهرست نام‌های کاربری معتبر را کشف کرد.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResult> {
    const genericMessage =
      'اگر این نام کاربری در سامانه وجود داشته باشد، لینک بازیابی برای آن ارسال می‌شود.';

    const user = await this.prisma.user.findFirst({
      where: { username: dto.username, status: UserStatus.active },
      select: { id: true, tenantId: true },
    });

    if (!user) return { message: genericMessage };

    const { token, tokenHash } = this.passwords.createResetToken();
    const expiresAt = new Date(Date.now() + this.ttlMinutes * 60 * 1000);

    // توکن‌های استفاده‌نشدهٔ قبلی باطل می‌شوند تا هم‌زمان چند لینک معتبر نباشد.
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);

    await this.audit.record({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'password_reset_requested',
    });

    if (!this.isProduction) {
      this.logger.warn(
        `توکن بازیابی رمز برای «${dto.username}» (فقط محیط توسعه): ${token}`,
      );
      return { message: genericMessage, devToken: token };
    }

    return { message: genericMessage };
  }

  /** ثبت رمز جدید با توکن یک‌بارمصرف. */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.passwords.hashToken(dto.token);

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { tenantId: true, status: true } },
      },
    });

    const invalid =
      !record ||
      record.usedAt !== null ||
      record.expiresAt < new Date() ||
      record.user.status !== UserStatus.active;

    if (invalid) {
      throw new BadRequestException(
        'لینک بازیابی نامعتبر یا منقضی شده است. دوباره درخواست دهید.',
      );
    }

    const passwordHash = await this.passwords.hash(dto.newPassword);

    // مصرف توکن و تغییر رمز باید اتمیک باشند تا یک توکن دوبار جواب ندهد.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      tenantId: record.user.tenantId,
      userId: record.userId,
      action: 'password_reset_completed',
    });

    return { message: 'رمز عبور با موفقیت تغییر کرد.' };
  }
}
