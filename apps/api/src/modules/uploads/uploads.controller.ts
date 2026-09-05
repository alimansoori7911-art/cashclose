import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public, Roles } from '../../common/decorators/roles.decorator';
import type { RequestUser } from '../../common/tenant/request-user';
import { UploadAccessService } from './upload-access.service';
import { UploadTokenService } from './upload-token.service';
import {
  UploadsService,
  type UploadedFile as UploadedFileType,
} from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploads: UploadsService,
    private readonly tokens: UploadTokenService,
    private readonly access: UploadAccessService,
  ) {}

  @Post('transactions/:transactionId')
  @Roles(UserRole.cashier)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'آپلود تصویر برای یک تراکنش' })
  // حافظه به‌جای دیسک: فایل باید پیش از نوشتن اعتبارسنجی شود، و سقف
  // حجم اینجا هم به‌عنوان لایهٔ اول دفاع اعمال می‌شود تا فایل بزرگ اصلاً
  // کامل خوانده نشود.
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 3 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @CurrentUser() user: RequestUser,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @UploadedFile() file: UploadedFileType,
  ) {
    return this.uploads.uploadForTransaction(user, transactionId, file);
  }

  /**
   * صدور لینک کوتاه‌مدت برای نمایش تصویر.
   *
   * تگ `<img>` هدر Authorization نمی‌فرستد، پس فرانت‌اند اول این لینک
   * امضاشده را می‌گیرد و بعد آن را در `src` می‌گذارد.
   */
  @Get(':id/link')
  @ApiOperation({ summary: 'دریافت لینک کوتاه‌مدت تصویر' })
  async getLink(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // بررسی دسترسی همین‌جا انجام می‌شود تا لینک فقط برای کسی صادر شود
    // که واقعاً حق دیدن تصویر را دارد.
    await this.access.assertCanView(user, id);

    const { token, expiresAt } = this.tokens.sign(id, user.id);
    return {
      url: `/api/v1/uploads/${id}/content?token=${token}`,
      expiresAt,
    };
  }

  @Public()
  @Get(':id/content')
  @ApiOperation({ summary: 'دریافت محتوای تصویر با امضای کوتاه‌مدت' })
  async getContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, originalName } =
      await this.access.getContentBySignature(id, token ?? '');

    res.setHeader('Content-Type', mimeType);
    // inline تا در مدال نمایش داده شود، نه اینکه دانلود شود.
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(originalName)}`,
    );
    // تصاویر تغییرناپذیرند (کلید یکتا)، پس کش طولانی امن است.
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(buffer);
  }

  @Delete(':id')
  @Roles(UserRole.cashier)
  @ApiOperation({ summary: 'حذف تصویر (فقط در حالت پیش‌نویس)' })
  remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.uploads.remove(user, id);
  }
}
