import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import type { RequestUser } from '../../../common/tenant/request-user';
import {
  buildRegisterWhere,
  type RegisterFilters,
} from '../../cash-registers/services/register-filters';

/**
 * نمای جدولی صندوق‌ها (بند ۹ سند: جدول حسابدار).
 *
 * هر ردیف یک صندوق و هر ستون یک قلم است، تا حسابدار بتواند چند روز را
 * کنار هم ببیند و ناهماهنگی را با یک نگاه پیدا کند — کاری که با
 * بازکردن تک‌تک صندوق‌ها ممکن نیست.
 *
 * سقف عمدی دارد: جدولی با صدها ردیف نه در مرورگر قابل استفاده است نه
 * برای سرور ارزان تمام می‌شود.
 */
const MAX_ROWS = 62;

export interface CellImage {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** یک خانهٔ جدول — مبلغ به‌همراه آنچه پشتش است. */
export interface MatrixCell {
  amount: string;
  /** توضیح‌های ردیف‌های این قلم، برای نمایش به‌صورت hint. */
  descriptions: string[];
  /** تصاویر همهٔ ردیف‌های این قلم، برای بازکردن با کلیک. */
  images: CellImage[];
}

@Injectable()
export class RegisterMatrixService {
  constructor(private readonly prisma: PrismaService) {}

  async build(actor: RequestUser, filters: RegisterFilters) {
    const registers = await this.prisma.cashRegister.findMany({
      where: buildRegisterWhere(actor, filters),
      select: {
        id: true,
        businessDate: true,
        coversUntilDate: true,
        status: true,
        registerBalance: true,
        documentsTotal: true,
        difference: true,
        branch: { select: { name: true } },
        cashier: { select: { fullName: true } },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            terminal: { select: { name: true } },
            // خودِ تصاویر می‌آیند نه فقط تعدادشان: کلیک روی خانه باید
            // بی‌درنگ بازشان کند، بدون یک رفت‌وبرگشت دیگر.
            uploads: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                sizeBytes: true,
              },
            },
          },
        },
      },
      orderBy: { businessDate: 'desc' },
      take: MAX_ROWS,
    });

    return registers.map((register) => ({
      id: register.id,
      date: register.businessDate.toISOString().slice(0, 10),
      coversUntil: register.coversUntilDate?.toISOString().slice(0, 10) ?? null,
      status: register.status,
      branchName: register.branch.name,
      cashierName: register.cashier.fullName,
      registerBalance: register.registerBalance,
      documentsTotal: register.documentsTotal,
      difference: register.difference,
      cells: groupByType(register.transactions),
    }));
  }
}

type RawTransaction = {
  id: string;
  type: string;
  amount: bigint;
  description: string | null;
  terminal: { name: string } | null;
  uploads: CellImage[];
};

/**
 * جمع‌کردن چند ردیف یک قلم در یک خانه.
 *
 * چک یا کارتخوان می‌تواند چند ردیف داشته باشد؛ جدول جمعشان را نشان
 * می‌دهد ولی توضیح و تصویر همه را نگه می‌دارد تا با hover و کلیک قابل
 * دیدن باشند.
 */
function groupByType(
  transactions: RawTransaction[],
): Record<string, MatrixCell> {
  const cells: Record<string, MatrixCell> = {};

  for (const item of transactions) {
    const cell = cells[item.type] ?? {
      amount: '0',
      descriptions: [],
      images: [],
    };

    cell.amount = (BigInt(cell.amount) + item.amount).toString();
    cell.images.push(...item.uploads);

    if (item.description?.trim()) {
      // نام دستگاه به توضیح چسبانده می‌شود تا در hint معلوم باشد کدام
      // کارتخوان چه توضیحی داشته.
      cell.descriptions.push(
        item.terminal
          ? `${item.terminal.name}: ${item.description.trim()}`
          : item.description.trim(),
      );
    }

    cells[item.type] = cell;
  }

  return cells;
}
