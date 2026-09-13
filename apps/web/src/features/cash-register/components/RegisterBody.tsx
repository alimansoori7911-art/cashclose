import type { CashCalculationResult, TransactionType } from '@cashclose/shared';

import type {
  AnomalyHint,
  TypeHint,
} from '../hooks/useDifferenceHelp';
import type { FormRow } from '../hooks/useRegisterForm';
import { BalanceBar } from './BalanceBar';
import { DifferenceHelp } from './DifferenceHelp';
import { RegisterForm } from './RegisterForm';

interface Props {
  rows: FormRow[];
  calculation: CashCalculationResult;
  readOnly: boolean;
  previousByType: Map<string, number>;
  suggestions: TypeHint[];
  anomalies: AnomalyHint[];
  onUpdate: (key: string, patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onAddRow: (type: TransactionType) => void;
  onRemoveRow: (key: string) => void;
}

/**
 * بدنهٔ صفحهٔ صندوق: نوار تراز، فرم دوستونی و راهنمای اختلاف.
 *
 * از صفحه جدا شده تا صفحه فقط مسئول واکشی داده و مدیریت حالت بماند.
 */
export function RegisterBody({
  rows,
  calculation,
  readOnly,
  previousByType,
  suggestions,
  anomalies,
  onUpdate,
  onAddRow,
  onRemoveRow,
}: Props) {
  return (
    <>
      <BalanceBar calculation={calculation} />

      <div className="h-4" />

      <RegisterForm
        rows={rows}
        calculation={calculation}
        readOnly={readOnly}
        previousByType={previousByType}
        onUpdate={onUpdate}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
      />

      {/* راهنمای اختلاف فقط وقتی معنا دارد که صندوق هنوز قابل ویرایش
          باشد؛ در حالت خواندنی کاری از صندوقدار برنمی‌آید. */}
      {!readOnly && (
        <>
          <div className="h-5" />
          <DifferenceHelp
            difference={Number(calculation.difference)}
            suggestions={suggestions}
            anomalies={anomalies}
            onAddRow={onAddRow}
          />
        </>
      )}
    </>
  );
}
