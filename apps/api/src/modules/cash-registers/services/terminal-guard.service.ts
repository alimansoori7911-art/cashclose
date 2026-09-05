import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { SaveDraftDto } from '../dto/save-draft.dto';

/**
 * بررسی تعلق کارتخوان به شعبهٔ صندوق.
 *
 * بدون این بررسی، شناسهٔ دستگاهِ شعبه یا **مستأجر دیگر** مستقیم در ردیف
 * ذخیره می‌شد و گزارش «کدام دستگاه چقدر فروخته» را مسموم می‌کرد —
 * اعتبارسنجی DTO فقط قالب UUID را می‌بیند، نه مالکیت را.
 */
@Injectable()
export class TerminalGuardService {
  constructor(private readonly prisma: PrismaService) {}

  async assertBelongsToBranch(
    branchId: string,
    dto: SaveDraftDto,
  ): Promise<void> {
    const ids = [
      ...new Set(
        dto.transactions
          .map((t) => t.terminalId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    if (ids.length === 0) return;

    const found = await this.prisma.posTerminal.findMany({
      where: { id: { in: ids }, branchId },
      select: { id: true },
    });

    if (found.length !== ids.length) {
      throw new BadRequestException(
        'کارتخوان انتخاب‌شده متعلق به شعبهٔ این صندوق نیست.',
      );
    }
  }
}
