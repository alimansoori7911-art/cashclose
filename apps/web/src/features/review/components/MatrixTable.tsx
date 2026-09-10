import { formatJalali, formatMoney, TRANSACTION_TYPES } from '@cashclose/shared';

import { RegisterStatusBadge } from '../../../components/ui/StatusBadge/index';
import type { CellImage, MatrixRow } from '../hooks/useMatrix';
import { MatrixCellView } from './MatrixCell';

interface Props {
  rows: MatrixRow[];
  onOpenImages: (images: CellImage[], label: string) => void;
}

/**
 * جدول مقایسهٔ چند صندوق (بند ۹ سند).
 *
 * هر ردیف یک صندوق و هر ستون یک قلم. جدول عمداً پهن است و افقی اسکرول
 * می‌شود: فشرده‌کردنش یعنی حذف ستون، و حسابدار دقیقاً برای دیدن همهٔ
 * ستون‌ها کنار هم به این نما می‌آید.
 *
 * ستون‌های هویتی (تاریخ، شعبه، صندوقدار) هنگام اسکرول افقی می‌چسبند،
 * وگرنه معلوم نمی‌ماند عدد وسط جدول مال کدام روز است.
 */
export function MatrixTable({ rows, onOpenImages }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-text-muted">
        صندوقی با این فیلترها یافت نشد.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-max border-collapse bg-surface text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            <Th sticky>تاریخ</Th>
            <Th>شعبه</Th>
            <Th>صندوقدار</Th>
            {TRANSACTION_TYPES.map((def) => (
              <Th key={def.type} numeric>
                {def.label}
              </Th>
            ))}
            <Th numeric>مانده صندوق</Th>
            <Th numeric>جمع اسناد</Th>
            <Th>وضعیت</Th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-surface-muted"
            >
              <Td sticky>
                {formatJalali(row.date)}
                {row.coversUntil && (
                  <span className="block text-xs text-text-muted">
                    تا {formatJalali(row.coversUntil)}
                  </span>
                )}
              </Td>
              <Td>{row.branchName}</Td>
              <Td>{row.cashierName}</Td>

              {TRANSACTION_TYPES.map((def) => (
                <Td key={def.type} numeric>
                  <MatrixCellView
                    cell={row.cells[def.type]}
                    onOpenImages={() =>
                      onOpenImages(
                        row.cells[def.type]?.images ?? [],
                        `${def.label} — ${formatJalali(row.date)}`,
                      )
                    }
                  />
                </Td>
              ))}

              <Td numeric>
                <span className="financial-figure">
                  {formatMoney(row.registerBalance)}
                </span>
              </Td>
              <Td numeric>
                <span className="financial-figure">
                  {formatMoney(row.documentsTotal)}
                </span>
              </Td>
              <Td>
                <RegisterStatusBadge status={row.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  numeric,
  sticky,
}: {
  children: React.ReactNode;
  numeric?: boolean;
  sticky?: boolean;
}) {
  return (
    <th
      scope="col"
      className={[
        'whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-text',
        numeric ? 'text-left' : 'text-right',
        sticky ? 'sticky right-0 z-10 bg-surface-muted' : '',
      ].join(' ')}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  numeric,
  sticky,
}: {
  children: React.ReactNode;
  numeric?: boolean;
  sticky?: boolean;
}) {
  return (
    <td
      className={[
        'whitespace-nowrap px-3 py-2 text-text',
        numeric ? 'text-left' : 'text-right',
        sticky ? 'sticky right-0 z-10 bg-surface' : '',
      ].join(' ')}
    >
      {children}
    </td>
  );
}
