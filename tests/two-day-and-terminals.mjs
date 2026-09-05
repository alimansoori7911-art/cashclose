/**
 * تست انتها‌به‌انتهای دو قابلیت: صندوق دوروزه و تفکیک کارتخوان.
 *
 * پیش‌نیاز: صندوقدار نباید صندوق باز داشته باشد.
 *   npm run db:reset-registers --workspace @cashclose/api
 */

const BASE = 'http://localhost:3000/api/v1';
const results = [];

function check(label, condition, detail = '') {
  results.push({ label, ok: Boolean(condition), detail });
}

async function login(username, password = 'Cashclose@1404') {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return (await res.json()).accessToken;
}

async function call(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* غیر JSON */
  }
  return { status: res.status, body: json };
}

function isoDay(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const TODAY = isoDay(0);
const YESTERDAY = isoDay(-1);
const TOMORROW = isoDay(1);

const cashier = await login('cashier2');

// ─── قواعد تاریخ صندوق دوروزه ───

const future = await call('POST', '/cash-registers', cashier, {
  businessDate: YESTERDAY,
  isTwoDay: true,
  coversUntilDate: isoDay(2),
});
check(
  'بازهٔ بیش از دو روز رد می‌شود',
  future.status === 400,
  future.body?.message,
);

const backwards = await call('POST', '/cash-registers', cashier, {
  businessDate: TODAY,
  isTwoDay: true,
  coversUntilDate: YESTERDAY,
});
check(
  'تاریخ پایان پیش از شروع رد می‌شود',
  backwards.status === 400,
  backwards.body?.message,
);

const intoFuture = await call('POST', '/cash-registers', cashier, {
  businessDate: TODAY,
  isTwoDay: true,
  coversUntilDate: TOMORROW,
});
check(
  'روز دوم نمی‌تواند فردا باشد',
  intoFuture.status === 400,
  intoFuture.body?.message,
);

const missingEnd = await call('POST', '/cash-registers', cashier, {
  businessDate: YESTERDAY,
  isTwoDay: true,
});
check(
  'صندوق دوروزه بدون تاریخ پایان رد می‌شود',
  missingEnd.status === 400,
  missingEnd.body?.message,
);

// ─── ساخت صندوق دوروزهٔ معتبر ───

const created = await call('POST', '/cash-registers', cashier, {
  businessDate: YESTERDAY,
  isTwoDay: true,
  coversUntilDate: TODAY,
});
check('ساخت صندوق دوروزه', created.status === 201, created.body?.message);

const registerId = created.body?.id;
check(
  'تاریخ پوشش ذخیره شده است',
  created.body?.coversUntilDate?.slice(0, 10) === TODAY,
  `${created.body?.businessDate?.slice(0, 10)} تا ${created.body?.coversUntilDate?.slice(0, 10)}`,
);

// ─── تفکیک کارتخوان ───

const terminals = await call('GET', '/pos-terminals', cashier);
const active = (terminals.body ?? []).filter((t) => t.isActive);
check('صندوقدار دستگاه‌های شعبه‌اش را می‌بیند', active.length >= 2, `${active.length} دستگاه`);

if (registerId && active.length >= 2) {
  const saved = await call('PATCH', `/cash-registers/${registerId}/draft`, cashier, {
    transactions: [
      { type: 'sales_total', amount: 10_000_000 },
      { type: 'pos', amount: 6_000_000, terminalId: active[0].id },
      { type: 'pos', amount: 4_000_000, terminalId: active[1].id },
    ],
  });
  check('ذخیرهٔ دو ردیف کارتخوان با دستگاه', saved.status === 200);
  check(
    'جمع اسناد از دو دستگاه درست است',
    saved.body?.documentsTotal === 10_000_000,
    `${saved.body?.documentsTotal}`,
  );
  check('اختلاف صفر است', saved.body?.difference === 0);

  const detail = await call('GET', `/cash-registers/${registerId}`, cashier);
  const posRows = (detail.body?.transactions ?? []).filter((t) => t.type === 'pos');
  check('هر دو ردیف کارتخوان برگشتند', posRows.length === 2, `${posRows.length} ردیف`);
  check(
    'هر ردیف به دستگاه خودش وصل است',
    posRows.every((r) => r.terminalId) &&
      new Set(posRows.map((r) => r.terminalId)).size === 2,
    posRows.map((r) => r.terminal?.name).join('، '),
  );

  // دستگاه شعبهٔ دیگر نباید پذیرفته شود. صندوقدار خودش فقط دستگاه‌های
  // شعبهٔ خود را می‌بیند، پس شناسه از دید مالک گرفته می‌شود — دقیقاً
  // همان چیزی که یک مهاجم می‌تواند حدس بزند یا از جای دیگر به دست آورد.
  const owner = await login('owner');
  const all = await call('GET', '/pos-terminals', owner);
  const otherBranch = (all.body ?? []).find(
    (t) => t.branchId !== active[0].branchId,
  );

  if (otherBranch) {
    const cross = await call('PATCH', `/cash-registers/${registerId}/draft`, cashier, {
      transactions: [
        { type: 'pos', amount: 1_000_000, terminalId: otherBranch.id },
      ],
    });
    check(
      'دستگاه شعبهٔ دیگر رد می‌شود',
      cross.status === 400,
      `${cross.status} — ${cross.body?.message ?? ''}`,
    );
  } else {
    check('دستگاه شعبهٔ دیگر رد می‌شود', false, 'شعبهٔ دومی برای آزمون نبود');
  }

  const badTerminal = await call('PATCH', `/cash-registers/${registerId}/draft`, cashier, {
    transactions: [
      { type: 'pos', amount: 1_000_000, terminalId: 'not-a-uuid' },
    ],
  });
  check('شناسهٔ کارتخوان نامعتبر رد می‌شود', badTerminal.status === 400);
}

// ─── گزارش ───
const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log('\n' + '═'.repeat(50));
console.log(`مجموع: ${results.length - failed.length}/${results.length} موفق`);
if (failed.length > 0) process.exitCode = 1;
