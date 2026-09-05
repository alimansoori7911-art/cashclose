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
  const balanceTypes = useMemo(
    () => [
      ...getTypesBySide(FormulaSide.BALANCE_ADD),
      ...getTypesBySide(FormulaSide.BALANCE_SUBTRACT),
    ],
    [],
  );
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
          types={balanceTypes.map((d) => d.type)}
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
