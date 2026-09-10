import { FormulaSide, getTypesBySide, TransactionType } from '@cashclose/shared';
import { useMemo, useState } from 'react';

import type { FormRow } from '../hooks/useRegisterForm';
import { FormColumn } from './FormColumn';
import { TerminalBreakdownModal } from './TerminalBreakdownModal';

interface Props {
  rows: FormRow[];
  readOnly: boolean;
  onUpdate: (
    key: string,
    patch: Partial<Omit<FormRow, 'key' | 'type'>>,
  ) => void;
  onAddRow: (type: TransactionType) => void;
  onRemoveRow: (key: string) => void;
}

/**
 * فرم دوستونی صندوق.
 *
 * چیدمان عمداً آینهٔ فایل اکسلی است که صندوقدار سال‌ها با آن کار کرده:
 * راست = اقلام مانده صندوق (از حسابداری)، چپ = جمع اسناد (پول واقعی).
 */
export function RegisterForm({
  rows,
  readOnly,
  onUpdate,
  onAddRow,
  onRemoveRow,
}: Props) {
  /**
   * ترتیب ستون مانده صندوق.
   *
   * «فروش کل» و «برگشت کالا» عمداً کنار هم و در ابتدا می‌آیند: صندوقدار
   * هر دو را از **یک صفحهٔ** سیستم حسابداری می‌خواند. جداکردنشان (یکی
   * جزء مثبت، دیگری منفی) از نظر فرمول درست بود ولی کار را سخت می‌کرد.
   * فرمول دست‌نخورده می‌ماند؛ فقط چیدمان عوض می‌شود.
   */
  const balanceTypes = useMemo(() => {
    const accounting: TransactionType[] = [
      TransactionType.SALES_TOTAL,
      TransactionType.GOODS_RETURN,
    ];

    const rest = [
      ...getTypesBySide(FormulaSide.BALANCE_ADD),
      ...getTypesBySide(FormulaSide.BALANCE_SUBTRACT),
    ]
      .map((d) => d.type)
      .filter((type) => !accounting.includes(type));

    return [...accounting, ...rest];
  }, []);
  const documentTypes = useMemo(
    () => getTypesBySide(FormulaSide.DOCUMENT),
    [],
  );

  // کدام قلم ریز دستگاه‌هایش باز است؛ `null` یعنی هیچ‌کدام.
  const [openBreakdown, setOpenBreakdown] = useState<TransactionType | null>(
    null,
  );

  const shared = {
    rows,
    readOnly,
    onUpdate,
    onAddRow,
    onRemoveRow,
    onOpenBreakdown: setOpenBreakdown,
  };

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <FormColumn
          title="مانده صندوق"
          hint="محاسبه از سیستم حسابداری"
          types={balanceTypes}
          {...shared}
        />
        <FormColumn
          title="جمع اسناد"
          hint="پول و اسناد واقعی صندوق"
          types={documentTypes.map((d) => d.type)}
          {...shared}
        />
      </div>

      {openBreakdown && (
        <TerminalBreakdownModal
          open
          onClose={() => setOpenBreakdown(null)}
          rows={rows}
          type={openBreakdown}
          readOnly={readOnly}
          onUpdate={onUpdate}
          onAddRow={onAddRow}
          onRemoveRow={onRemoveRow}
        />
      )}
    </>
  );
}
