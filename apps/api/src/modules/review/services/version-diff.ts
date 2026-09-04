/**
 * مقایسهٔ دو نسخهٔ صندوق (بند ۳.۲ پرامپت و AC9 سند).
 *
 * بدون این، حسابدار فقط می‌دید «رد شد» ولی نمی‌فهمید صندوقدار **چه
 * چیزی** را عوض کرده است.
 *
 * مبالغ در payload به‌صورت رشته ذخیره شده‌اند (چون JSON از BigInt
 * پشتیبانی نمی‌کند)، پس مقایسه هم روی رشته انجام می‌شود تا دقت از دست
 * نرود.
 */

export interface VersionPayload {
  registerBalance: string;
  documentsTotal: string;
  difference: string;
  transactions: {
    type: string;
    amount: string;
    description: string | null;
    terminalId: string | null;
    sortOrder: number;
  }[];
}

export type ChangeKind = 'added' | 'removed' | 'changed' | 'unchanged';

export interface TransactionDiff {
  type: string;
  kind: ChangeKind;
  before: { amount: string; description: string | null } | null;
  after: { amount: string; description: string | null } | null;
}

export interface VersionDiff {
  totals: {
    registerBalance: { before: string; after: string; changed: boolean };
    documentsTotal: { before: string; after: string; changed: boolean };
    difference: { before: string; after: string; changed: boolean };
  };
  transactions: TransactionDiff[];
  changedCount: number;
}

/**
 * جمع مبالغ هر نوع تراکنش.
 *
 * مقایسه در سطح «نوع» انجام می‌شود نه تک‌تک ردیف‌ها: صندوقدار ممکن است
 * سه چک را به دو چک تبدیل کند، و آنچه برای حسابدار اهمیت دارد تغییرِ
 * جمعِ چک‌هاست، نه جابه‌جایی ردیف‌ها.
 */
function sumByType(payload: VersionPayload) {
  const totals = new Map<string, bigint>();
  const notes = new Map<string, string[]>();

  for (const item of payload.transactions ?? []) {
    const amount = BigInt(item.amount || '0');
    totals.set(item.type, (totals.get(item.type) ?? 0n) + amount);

    if (item.description?.trim()) {
      const list = notes.get(item.type) ?? [];
      list.push(item.description.trim());
      notes.set(item.type, list);
    }
  }

  return { totals, notes };
}

function describe(
  totals: Map<string, bigint>,
  notes: Map<string, string[]>,
  type: string,
): { amount: string; description: string | null } | null {
  if (!totals.has(type)) return null;

  const note = notes.get(type);
  return {
    amount: (totals.get(type) ?? 0n).toString(),
    description: note && note.length > 0 ? note.join(' | ') : null,
  };
}

export function diffVersions(
  before: VersionPayload,
  after: VersionPayload,
): VersionDiff {
  const left = sumByType(before);
  const right = sumByType(after);

  const allTypes = new Set([...left.totals.keys(), ...right.totals.keys()]);
  const transactions: TransactionDiff[] = [];
  let changedCount = 0;

  for (const type of allTypes) {
    const beforeItem = describe(left.totals, left.notes, type);
    const afterItem = describe(right.totals, right.notes, type);

    let kind: ChangeKind;
    if (!beforeItem) kind = 'added';
    else if (!afterItem) kind = 'removed';
    else if (
      beforeItem.amount !== afterItem.amount ||
      beforeItem.description !== afterItem.description
    ) {
      kind = 'changed';
    } else kind = 'unchanged';

    if (kind !== 'unchanged') changedCount += 1;

    transactions.push({ type, kind, before: beforeItem, after: afterItem });
  }

  // تغییرات اول می‌آیند تا حسابدار مجبور نباشد دنبالشان بگردد.
  const order: Record<ChangeKind, number> = {
    changed: 0,
    added: 1,
    removed: 2,
    unchanged: 3,
  };
  transactions.sort((a, b) => order[a.kind] - order[b.kind]);

  const field = (key: keyof VersionPayload & string) => ({
    before: String(before[key] ?? '0'),
    after: String(after[key] ?? '0'),
    changed: String(before[key] ?? '0') !== String(after[key] ?? '0'),
  });

  return {
    totals: {
      registerBalance: field('registerBalance'),
      documentsTotal: field('documentsTotal'),
      difference: field('difference'),
    },
    transactions,
    changedCount,
  };
}
