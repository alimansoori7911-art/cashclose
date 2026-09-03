import { Injectable } from '@nestjs/common';
import type { TransactionType } from '@prisma/client';

import type { CashCalculationResult } from '@cashclose/shared';
import { calculateCashRegister } from '@cashclose/shared';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { toSharedType } from '../transaction-type.mapper';

/**
 * پل بین دادهٔ دیتابیس و موتور محاسبهٔ مشترک.
 *
 * نکتهٔ کلیدی: محاسبه **همیشه** سمت سرور و از روی تراکنش‌های ذخیره‌شده
 * انجام می‌شود — هرگز از مقادیری که کلاینت فرستاده. فرانت‌اند همان
 * موتور را برای نمایش زنده اجرا می‌کند، ولی عددی که در دیتابیس ثبت و
 * مبنای اجازهٔ بستن صندوق می‌شود، فقط این است.
 */
@Injectable()
export class RegisterCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  /** محاسبه از روی تراکنش‌های ذخیره‌شدهٔ یک صندوق. */
  async calculate(cashRegisterId: string): Promise<CashCalculationResult> {
    const transactions = await this.prisma.transaction.findMany({
      where: { cashRegisterId },
      select: { type: true, amount: true },
    });

    return this.preview(transactions);
  }

  /**
   * محاسبه و ذخیرهٔ نتیجه روی خود صندوق.
   *
   * جمع‌ها روی رکورد صندوق نگه داشته می‌شوند تا فهرست‌ها و گزارش‌ها
   * بدون خواندن همهٔ تراکنش‌ها سریع بمانند.
   */
  async recalculateAndSave(
    cashRegisterId: string,
  ): Promise<CashCalculationResult> {
    const result = await this.calculate(cashRegisterId);

    await this.prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        registerBalance: result.registerBalance,
        documentsTotal: result.documentsTotal,
        difference: result.difference,
      },
    });

    return result;
  }

  /** محاسبهٔ مستقیم از ورودی — برای پیش‌نمایش پیش از ذخیره. */
  preview(
    transactions: { type: TransactionType; amount: number | bigint }[],
  ): CashCalculationResult {
    return calculateCashRegister(
      transactions.map((t) => ({
        type: toSharedType(t.type),
        amount: t.amount,
      })),
    );
  }
}
