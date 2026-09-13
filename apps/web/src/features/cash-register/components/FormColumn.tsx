import {
  formatMoney,
  isPrimaryType,
  TransactionType,
} from '@cashclose/shared';
import { useState } from 'react';

import type { FormRow } from '../hooks/useRegisterForm';
import { SecondaryToggle } from './SecondaryToggle';
import { TypeGroup } from './TypeGroup';

interface Props {
  title: string;
  hint: string;
  total: number;
  tone: 'balance' | 'documents';
  types: TransactionType[];
  rows: FormRow[];
  readOnly: boolean;
  /** جمع هر قلم در صندوق قبلی — برای مقایسه. */
  previousByType: Map<string, number>;
  onUpdate: (key: string, patch: Partial<Omit<FormRow, 'key' | 'type'>>) => void;
  onAddRow: (type: TransactionType) => void;
  onRemoveRow: (key: string) => void;
  onOpenBreakdown: (type: TransactionType) => void;
}

/**
 * یک ستون فرم صندوق — مانده صندوق یا جمع اسناد.
 *
 * اقلام پرکاربرد همیشه بازند و نادرها پشت یک بازکننده. اندازه‌گیری روی
 * صندوق‌های واقعی نشان داد چهار قلم در ۹۷٪ صندوق‌ها پر می‌شوند و بقیه
 * تقریباً هیچ‌وقت؛ نمایش هم‌وزن همه یعنی صندوقدار هر روز از میان چیزهایی
 * رد می‌شود که به کارش نمی‌آید.
 */
export function FormColumn({
  title,
  hint,
  total,
  tone,
  types,
  rows,
  readOnly,
  previousByType,
  onUpdate,
  onAddRow,
  onRemoveRow,
  onOpenBreakdown,
}: Props) {
  const primary = types.filter(isPrimaryType);
  const secondary = types.filter((type) => !isPrimaryType(type));

  // قلمی که مبلغ دارد نباید پنهان بماند؛ صندوقدار باید چیزی را که پر
  // کرده ببیند.
  const secondaryFilled = secondary.some((type) =>
    rows.some((row) => row.type === type && (row.amount ?? 0) > 0),
  );
  const [expanded, setExpanded] = useState(false);
  const showSecondary = expanded || secondaryFilled;

  const shared = {
    rows,
    readOnly,
    onUpdate,
    onAddRow,
    onRemoveRow,
    onOpenBreakdown,
  };

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-2 border-b-2 border-border pb-2">
        <h2 className="text-sm font-semibold text-text">
          {title}
          <span className="mr-2 text-xs font-normal text-text-muted">
            — {hint}
          </span>
        </h2>
        <span
          className={[
            'financial-figure shrink-0 text-base font-semibold',
            tone === 'balance' ? 'text-surplus' : 'text-balanced',
          ].join(' ')}
        >
          {formatMoney(total)}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {primary.map((type) => (
          <TypeGroup
            key={type}
            type={type}
            previousAmount={previousByType.get(type)}
            {...shared}
          />
        ))}
      </div>

      {secondary.length > 0 && (
        <div className="mt-3">
          <SecondaryToggle
            count={secondary.length}
            expanded={showSecondary}
            hasValue={secondaryFilled}
            onToggle={() => setExpanded((value) => !value)}
          />

          {showSecondary && (
            <div className="mt-2.5 flex flex-col gap-2.5">
              {secondary.map((type) => (
                <TypeGroup
                  key={type}
                  type={type}
                  previousAmount={previousByType.get(type)}
                  {...shared}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
