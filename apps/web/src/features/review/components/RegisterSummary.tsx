import { formatRial } from '@cashclose/shared';

/** کارت‌های خلاصهٔ صندوق در صفحهٔ بررسی. */
export function RegisterSummary({
  registerBalance,
  documentsTotal,
  difference,
}: {
  registerBalance: number;
  documentsTotal: number;
  difference: number;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <Card label="مانده صندوق" value={formatRial(registerBalance)} />
      <Card label="جمع اسناد" value={formatRial(documentsTotal)} />
      <Card
        label="اختلاف"
        value={formatRial(difference)}
        tone={
          difference === 0
            ? 'text-balanced'
            : difference > 0
              ? 'text-surplus'
              : 'text-shortage'
        }
      />
    </dl>
  );
}

function Card({
  label,
  value,
  tone = 'text-text',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className={`mt-1 text-base font-semibold tabular-nums ${tone}`}>
        {value}
      </dd>
    </div>
  );
}
