/**
 * تست موارد لبه‌ای و امنیتی — جاهایی که باگ معمولاً پنهان می‌ماند.
 *
 * بخش ۱۲ سند (Edge Cases) به‌علاوهٔ حملات رایج.
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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* غیر JSON */
  }
  return { status: res.status, body: json, raw: text };
}

const cashier = await login('cashier1');
const manager = await login('manager');
const accountant = await login('accountant');

// ─── تزریق و ورودی مخرب ───
const sqlInjection = await call('GET', "/users?role=cashier'--", manager);
check('تزریق SQL در فیلتر رد می‌شود', sqlInjection.status === 400);

const xssBranch = await call('POST', '/branches', manager, {
  storeId: (await call('GET', '/stores', manager)).body?.items?.[0]?.id,
  name: '<script>alert(1)</script>',
});
check(
  'متن HTML به‌صورت خام ذخیره می‌شود نه اجرا',
  xssBranch.status === 201 &&
    xssBranch.body?.name === '<script>alert(1)</script>',
  'اسکیپ در لایهٔ نمایش React انجام می‌شود',
);

const hugePayload = await call('POST', '/branches', manager, {
  storeId: 'x',
  name: 'ب'.repeat(5000),
});
check('نام بیش از حد بلند رد می‌شود', hugePayload.status === 400);

const extraField = await call('POST', '/branches', manager, {
  storeId: 'x',
  name: 'تست',
  isActive: true,
  tenantId: 'hijack-attempt',
});
check(
  'فیلد ناشناخته رد می‌شود (جلوگیری از دست‌کاری tenantId)',
  extraField.status === 400,
);

// ─── مبالغ نامعتبر ───
const current = await call('GET', '/cash-registers/current', cashier);
const registerId = current.body?.id;

if (registerId) {
  const negative = await call(
    'PATCH',
    `/cash-registers/${registerId}/draft`,
    cashier,
    { transactions: [{ type: 'cash', amount: -1000 }] },
  );
  check('مبلغ منفی رد می‌شود', negative.status === 400);

  const decimal = await call(
    'PATCH',
    `/cash-registers/${registerId}/draft`,
    cashier,
    { transactions: [{ type: 'cash', amount: 1000.5 }] },
  );
  check('مبلغ اعشاری رد می‌شود', decimal.status === 400);

  const tooBig = await call(
    'PATCH',
    `/cash-registers/${registerId}/draft`,
    cashier,
    { transactions: [{ type: 'cash', amount: 9_999_999_999 }] },
  );
  check('مبلغ بیش از ۹ رقم رد می‌شود', tooBig.status === 400);

  const badType = await call(
    'PATCH',
    `/cash-registers/${registerId}/draft`,
    cashier,
    { transactions: [{ type: 'not_a_type', amount: 100 }] },
  );
  check('نوع تراکنش نامعتبر رد می‌شود', badType.status === 400);

  const longDesc = await call(
    'PATCH',
    `/cash-registers/${registerId}/draft`,
    cashier,
    {
      transactions: [
        { type: 'cash', amount: 100, description: 'ا'.repeat(400) },
      ],
    },
  );
  check('توضیح بیش از ۳۰۰ کاراکتر رد می‌شود', longDesc.status === 400);
}

// ─── شناسه‌های نامعتبر ───
const badUuid = await call('GET', '/cash-registers/not-a-uuid', cashier);
check('شناسهٔ غیر UUID رد می‌شود', badUuid.status === 400);

const missing = await call(
  'GET',
  '/cash-registers/00000000-0000-4000-8000-000000000000',
  cashier,
);
check('شناسهٔ ناموجود ۴۰۴ می‌دهد', missing.status === 404);

// ─── صفحه‌بندی ───
const hugeLimit = await call('GET', '/users?limit=999999', manager);
check('limit بیش از سقف رد می‌شود', hugeLimit.status === 400);

const zeroPage = await call('GET', '/users?page=0', manager);
check('شمارهٔ صفحهٔ صفر رد می‌شود', zeroPage.status === 400);

const negPage = await call('GET', '/users?page=-5', manager);
check('شمارهٔ صفحهٔ منفی رد می‌شود', negPage.status === 400);

// ─── بدنهٔ خالی و ناقص ───
const emptyLogin = await call('POST', '/auth/login', null, {});
check('ورود با بدنهٔ خالی رد می‌شود', emptyLogin.status === 400);

const nullBody = await fetch(`${BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: 'not-json-at-all',
});
check('بدنهٔ غیر JSON رد می‌شود', nullBody.status === 400);

// ─── دسترسی افقی ───
const otherUsers = await call('GET', '/users', manager);
const someUserId = otherUsers.body?.items?.find(
  (u) => u.username === 'cashier2',
)?.id;

if (someUserId) {
  const selfDeactivate = await call('DELETE', `/users/${someUserId}`, cashier);
  check('صندوقدار نمی‌تواند کاربر غیرفعال کند', selfDeactivate.status === 403);
}

const managerId = otherUsers.body?.items?.find(
  (u) => u.username === 'manager',
)?.id;

if (managerId) {
  const selfRole = await call('PATCH', `/users/${managerId}`, manager, {
    role: 'owner',
  });
  check(
    'مدیر نمی‌تواند نقش خودش را ارتقا دهد',
    selfRole.status === 400 || selfRole.status === 403,
    selfRole.body?.message,
  );
}

// ─── حسابدار فقط خواندنی است ───
const accountantWrite = await call('POST', '/branches', accountant, {
  storeId: 'x',
  name: 'تست',
});
check('حسابدار نمی‌تواند شعبه بسازد', accountantWrite.status === 403);

const accountantDraft = registerId
  ? await call('PATCH', `/cash-registers/${registerId}/draft`, accountant, {
      transactions: [],
    })
  : { status: 403 };
check('حسابدار نمی‌تواند صندوق را ویرایش کند', accountantDraft.status === 403);

// ─── محدودیت نرخ ───
const rapid = await Promise.all(
  Array.from({ length: 15 }, () =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nobody_x', password: 'x' }),
    }).then((r) => r.status),
  ),
);
check(
  'محدودیت نرخ روی ورود فعال است',
  rapid.some((s) => s === 429),
  `کدها: ${[...new Set(rapid)].join(', ')}`,
);

// ─── گزارش ───
const failed = results.filter((r) => !r.ok);

console.log('\nموارد لبه‌ای و امنیتی\n' + '─'.repeat(50));
for (const r of results) {
  const mark = r.ok ? '✓' : '✗';
  console.log(`  ${mark} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
}

console.log(
  `\n${'═'.repeat(50)}\nمجموع: ${results.length - failed.length}/${results.length} موفق`,
);

if (failed.length > 0) {
  console.log(`\n❌ ناموفق:`);
  for (const f of failed) console.log(`   ${f.label}`);
  process.exitCode = 1;
}
