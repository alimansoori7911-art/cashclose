import { formatMoney, type CashCalculationResult } from '@cashclose/shared';

/**
 * نوار تراز — دو کفهٔ ترازو.
 *
 * سه عدد خشک به صندوقدار نمی‌گوید «چقدر مانده»؛ دو نوار کنار هم می‌گوید.
 * وقتی تراز شود دو کفه دقیقاً هم‌اندازه می‌شوند و نوار قرمز محو — یک
 * بازخورد بصری که تمام‌شدن کار را اعلام می‌کند.
 */
export function BalanceBar({
  calculation,
}: {
  calculation: CashCalculationResult;
}) {
  const balance = Number(calculation.registerBalance);
  const documents = Number(calculation.documentsTotal);
  const difference = Number(calculation.difference);

  // مقیاس بر پایهٔ بزرگ‌ترین کفه؛ تقسیم بر صفر وقتی صندوق خالی است.
  const largest = Math.max(balance, documents, 1);
  const balanceWidth = (balance / largest) * 100;
  const documentsWidth = (documents / largest) * 100;
  const gapWidth = (Math.abs(difference) / largest) * 100;

  const isBalanced = difference === 0;
  const isShortage = difference < 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-text-muted">وضعیت تراز</span>
        <StatusPill
          isBalanced={isBalanced}
          isShortage={isShortage}
          amount={Math.abs(difference)}
        />
      </div>

      {/* دو کفه با فاصلهٔ کمبود. ارتفاع ثابت تا با تغییر ارقام نپرد. */}
      <div className="flex h-8 gap-0.5 overflow-hidden rounded">
        <Pane
          width={balanceWidth}
          label="مانده صندوق"
          amount={balance}
          tone="balance"
        />
        <Pane
          width={documentsWidth}
          label="جمع اسناد"
          amount={documents}
          tone="documents"
        />
        {!isBalanced && (
          <div
            className="bg-shortage transition-all"
            style={{ width: `${Math.max(gapWidth, 1.5)}%` }}
            aria-hidden
          />
        )}
      </div>

      <p className="mt-2 text-xs text-text-muted">
        {isBalanced
          ? 'دو طرف برابرند؛ صندوق آمادهٔ بستن است.'
          : isShortage
            ? 'اسناد کمتر از مانده است — نوار قرمز فاصله‌ای است که باید پر شود.'
            : 'اسناد بیشتر از مانده است — نوار قرمز مقدار اضافه است.'}
      </p>
    </div>
  );
}

function Pane({
  width,
  label,
  amount,
  tone,
}: {
  width: number;
  label: string;
  amount: number;
  tone: 'balance' | 'documents';
}) {
  return (
    <div
      className={[
        'flex min-w-0 items-center justify-center transition-all',
        tone === 'balance' ? 'bg-surplus-soft' : 'bg-balanced-soft',
      ].join(' ')}
      style={{ width: `${width}%` }}
    >
      <span
        className={[
          'financial-figure truncate px-2 text-xs',
          tone === 'balance' ? 'text-surplus' : 'text-balanced',
        ].join(' ')}
      >
        {label} {formatMoney(amount)}
      </span>
    </div>
  );
}

/** نشان وضعیت — رنگ تنها حامل معنا نیست، متن هم می‌آید. */
function StatusPill({
  isBalanced,
  isShortage,
  amount,
}: {
  isBalanced: boolean;
  isShortage: boolean;
  amount: number;
}) {
  if (isBalanced) {
    return (
      <span className="rounded bg-balanced-soft px-3 py-1 text-xs text-balanced">
        تراز
      </span>
    );
  }

  return (
    <span className="financial-figure rounded bg-shortage-soft px-3 py-1 text-xs text-shortage">
      {isShortage ? 'کسری' : 'مازاد'} {formatMoney(amount)} ریال
    </span>
  );
}
