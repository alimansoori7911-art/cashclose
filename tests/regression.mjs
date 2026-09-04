/**
 * تست رگرسیون کامل فازهای ۰ تا ۵.
 *
 * هدف: پیش از شروع فاز ۶، مطمئن شویم هیچ‌کدام از قابلیت‌های قبلی
 * نشکسته‌اند و قواعد امنیتی هنوز برقرارند.
 *
 * این تست idempotent است و روی دیتابیسِ تمیز اجرا می‌شود.
 */

const BASE = 'http://localhost:3000/api/v1';
const RUN = Date.now().toString(36).slice(-5);

const results = [];
let currentSection = '';

function section(name) {
  currentSection = name;
}

function check(label, condition, detail = '') {
  results.push({
    section: currentSection,
    label,
    ok: Boolean(condition),
    detail,
  });
}

async function login(username, password = 'Cashclose@1404') {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  return { status: res.status, token: body.accessToken, body };
}

async function call(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
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

function makePng(padding = 300) {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(padding),
  ]);
}

async function upload(token, transactionId, buffer, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/png' }), filename);
  const res = await fetch(`${BASE}/uploads/transactions/${transactionId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
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

const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = iso(new Date());
const TOMORROW = iso(new Date(Date.now() + 86400000));

// ══════════════ فاز ۰: سلامت و محاسبه ══════════════
section('فاز ۰ — زیرساخت');

const health = await call('GET', '/health', null);
check('health بدون توکن در دسترس است', health.status === 200);
check('دیتابیس متصل است', health.body?.database === 'up');

// ══════════════ فاز ۱: احراز هویت ══════════════
section('فاز ۱ — احراز هویت و نقش‌ها');

const cashier = await login('cashier1');
const cashier2 = await login('cashier2');
const accountant = await login('accountant');
const manager = await login('manager');
const owner = await login('owner');

check('ورود صندوقدار', cashier.status === 200 && Boolean(cashier.token));
check('ورود حسابدار', accountant.status === 200);
check('ورود مدیر', manager.status === 200);
check('ورود مالک', owner.status === 200);

const badPass = await login('cashier1', 'WrongPassword');
check('رمز اشتباه رد می‌شود', badPass.status === 401);

const ghost = await login('ghost_user_xyz', 'whatever');
check(
  'پیام کاربر ناموجود با رمز اشتباه یکسان است',
  ghost.body?.message === badPass.body?.message,
  ghost.body?.message,
);

const noToken = await call('GET', '/users', null);
check('مسیر محافظت‌شده بدون توکن ۴۰۱ می‌دهد', noToken.status === 401);

const fakeToken = await call('GET', '/auth/me', 'fake.token.here');
check('توکن جعلی رد می‌شود', fakeToken.status === 401);

const me = await call('GET', '/auth/me', cashier.token);
check('auth/me اطلاعات درست برمی‌گرداند', me.body?.username === 'cashier1');

check(
  'صندوقدار به مدیریت کاربران دسترسی ندارد',
  (await call('GET', '/users', cashier.token)).status === 403,
);
check(
  'حسابدار به مدیریت کاربران دسترسی ندارد',
  (await call('GET', '/users', accountant.token)).status === 403,
);
check(
  'مدیر به مدیریت کاربران دسترسی دارد',
  (await call('GET', '/users', manager.token)).status === 200,
);

// ══════════════ فاز ۲: مدیریت فروشگاه ══════════════
section('فاز ۲ — مدیریت فروشگاه');

const stores = await call('GET', '/stores', manager.token);
check('فهرست فروشگاه‌ها', stores.status === 200);
const storeId = stores.body?.items?.[0]?.id;

const BRANCH_NAME = `شعبهٔ رگرسیون ${RUN}`;
const branch = await call('POST', '/branches', manager.token, {
  storeId,
  name: BRANCH_NAME,
});
check('ساخت شعبه', branch.status === 201);
check('نام فارسی سالم ذخیره شد', branch.body?.name === BRANCH_NAME);
const branchId = branch.body?.id;

const terminal = await call('POST', '/pos-terminals', manager.token, {
  branchId,
  name: `کارتخوان ${RUN}`,
  bank: 'سامان',
});
check('ساخت کارتخوان', terminal.status === 201);

const newUser = await call('POST', '/users', manager.token, {
  fullName: 'صندوقدار رگرسیون',
  username: `reg_${RUN}`,
  password: 'Reg@1404',
  role: 'cashier',
  branchId,
});
check('ساخت صندوقدار', newUser.status === 201);

const noBranch = await call('POST', '/users', manager.token, {
  fullName: 'بدون شعبه',
  username: `nb_${RUN}`,
  password: 'Nb@1404',
  role: 'cashier',
});
check('صندوقدار بدون شعبه رد می‌شود', noBranch.status === 400);

const escalate = await call('POST', '/users', manager.token, {
  fullName: 'ارتقای غیرمجاز',
  username: `esc_${RUN}`,
  password: 'Esc@1404',
  role: 'owner',
});
check('مدیر نمی‌تواند مالک بسازد', escalate.status === 403);

// فیلترها — باگی که در فاز ۵ رفع شد
check(
  'فیلتر نقش کاربران کار می‌کند',
  (await call('GET', '/users?role=cashier', manager.token)).status === 200,
);
check(
  'فیلتر شعبه کار می‌کند',
  (await call('GET', `/branches?storeId=${storeId}`, manager.token)).status ===
    200,
);
check(
  'فیلتر لاگ کار می‌کند',
  (await call('GET', '/audit-logs?action=login_success', manager.token))
    .status === 200,
);
check(
  'فیلتر کارتخوان کار می‌کند',
  (await call('GET', '/pos-terminals?activeOnly=true', manager.token))
    .status === 200,
);
check(
  'مقدار نامعتبر فیلتر رد می‌شود',
  (await call('GET', '/users?role=bogus', manager.token)).status === 400,
);

// ══════════════ فاز ۳: هستهٔ صندوق ══════════════
section('فاز ۳ — هستهٔ صندوق روزانه');

const future = await call('POST', '/cash-registers', cashier.token, {
  businessDate: TOMORROW,
});
check('صندوق تاریخ آینده رد می‌شود', future.status === 400);

let currentReg = await call('GET', '/cash-registers/current', cashier.token);
let registerId = currentReg.body?.id;

if (!registerId) {
  const created = await call('POST', '/cash-registers', cashier.token, {
    businessDate: TODAY,
  });
  check('ساخت صندوق امروز', created.status === 201);
  registerId = created.body?.id;
} else {
  check('ساخت صندوق امروز', true, 'از قبل موجود');
}

const dup = await call('POST', '/cash-registers', cashier.token, {
  businessDate: TODAY,
});
check('صندوق تکراری رد می‌شود', dup.status === 409);

const managerCreate = await call('POST', '/cash-registers', manager.token, {
  businessDate: TODAY,
});
check('مدیر نمی‌تواند صندوق بسازد', managerCreate.status === 403);

// محاسبه: کسری
const shortage = await call(
  'PATCH',
  `/cash-registers/${registerId}/draft`,
  cashier.token,
  {
    transactions: [
      { type: 'sales_total', amount: 16_000_000 },
      { type: 'cash', amount: 10_000_000 },
    ],
  },
);
check(
  'محاسبهٔ کسری درست است',
  shortage.body?.difference === -6_000_000 &&
    shortage.body?.cashStatus === 'shortage',
  `اختلاف: ${shortage.body?.difference}`,
);
check('بستن در حالت کسری غیرمجاز', shortage.body?.canClose === false);

const badClose = await call(
  'PATCH',
  `/cash-registers/${registerId}/close`,
  cashier.token,
);
check('بستن با اختلاف رد می‌شود', badClose.status === 400);

// محاسبه: مازاد
const surplus = await call(
  'PATCH',
  `/cash-registers/${registerId}/draft`,
  cashier.token,
  {
    transactions: [
      { type: 'sales_total', amount: 10_000_000 },
      { type: 'cash', amount: 12_000_000 },
    ],
  },
);
check(
  'محاسبهٔ مازاد درست است',
  surplus.body?.difference === 2_000_000 &&
    surplus.body?.cashStatus === 'surplus',
);

// محاسبه: تراز (بازتولید فرمول اکسل واقعی)
const balanced = await call(
  'PATCH',
  `/cash-registers/${registerId}/draft`,
  cashier.token,
  {
    transactions: [
      { type: 'sales_total', amount: 16_000_000 },
      { type: 'goods_return', amount: 1_000_000 },
      { type: 'cash', amount: 6_000_000 },
      { type: 'pos', amount: 9_000_000 },
    ],
  },
);
check(
  'فرمول اکسل بازتولید شد (۱۶M−۱M=۱۵M)',
  balanced.body?.registerBalance === 15_000_000 &&
    balanced.body?.documentsTotal === 15_000_000 &&
    balanced.body?.difference === 0,
  `مانده ${balanced.body?.registerBalance}`,
);
check('صندوق تراز قابل بستن است', balanced.body?.canClose === true);

const txId = balanced.body?.transactions?.[0]?.id;
check('شناسهٔ تراکنش برگردانده می‌شود', Boolean(txId));

// ══════════════ فاز ۴: آپلود عکس ══════════════
section('فاز ۴ — آپلود عکس');

const img1 = await upload(cashier.token, txId, makePng(), 'r1.png');
check('آپلود تصویر معتبر', img1.status === 201);
const uploadId = img1.body?.id;

const evil = await upload(
  cashier.token,
  txId,
  Buffer.from('<?php system($_GET["c"]); ?>'),
  'shell.png',
);
check('فایل غیرتصویری رد می‌شود', evil.status === 415);

const huge = await upload(cashier.token, txId, makePng(4 * 1024 * 1024), 'big.png');
check('فایل بزرگ رد می‌شود', huge.status === 413 || huge.status === 400);

const byAccountant = await upload(accountant.token, txId, makePng(), 'x.png');
check('حسابدار نمی‌تواند آپلود کند', byAccountant.status === 403);

const link = await call('GET', `/uploads/${uploadId}/link`, cashier.token);
check('لینک امضاشده صادر می‌شود', link.status === 200);

const withSig = await fetch(`http://localhost:3000${link.body?.url}`);
check(
  'تصویر با امضا قابل دریافت است',
  withSig.status === 200 &&
    withSig.headers.get('content-type')?.includes('image/png'),
);

const noSig = await fetch(`${BASE}/uploads/${uploadId}/content`);
check('دسترسی بدون امضا رد می‌شود', noSig.status === 403);

// تصاویر پس از ذخیرهٔ دوباره باقی می‌مانند (باگ رفع‌شدهٔ فاز ۴)
const beforeSave = await call(
  'GET',
  `/cash-registers/${registerId}`,
  cashier.token,
);
const countBefore =
  beforeSave.body?.transactions?.find((t) => t.id === txId)?.uploads?.length ??
  0;

await call('PATCH', `/cash-registers/${registerId}/draft`, cashier.token, {
  transactions: [
    { id: txId, type: 'sales_total', amount: 16_000_000 },
    { type: 'goods_return', amount: 1_000_000 },
    { type: 'cash', amount: 6_000_000 },
    { type: 'pos', amount: 9_000_000 },
  ],
});

const afterSave = await call(
  'GET',
  `/cash-registers/${registerId}`,
  cashier.token,
);
const countAfter =
  afterSave.body?.transactions?.find((t) => t.id === txId)?.uploads?.length ?? 0;

check(
  'ذخیرهٔ دوباره تصاویر را حفظ می‌کند',
  countBefore > 0 && countBefore === countAfter,
  `${countBefore} → ${countAfter}`,
);

// ══════════════ فاز ۵: فلوی حسابدار ══════════════
section('فاز ۵ — فلوی حسابدار');

const closed = await call(
  'PATCH',
  `/cash-registers/${registerId}/close`,
  cashier.token,
);
check('بستن صندوق تراز', closed.status === 200);

const editClosed = await call(
  'PATCH',
  `/cash-registers/${registerId}/draft`,
  cashier.token,
  { transactions: [{ type: 'cash', amount: 1 }] },
);
check('صندوق بسته قابل ویرایش نیست', editClosed.status === 409);

const deleteAfterClose = await call(
  'DELETE',
  `/uploads/${uploadId}`,
  cashier.token,
);
check('حذف تصویر پس از ارسال ممنوع است', deleteAfterClose.status === 400);

const managerApprove = await call(
  'POST',
  `/cash-registers/${registerId}/approve`,
  manager.token,
  {},
);
check('مدیر نمی‌تواند تأیید کند', managerApprove.status === 403);

const noReason = await call(
  'POST',
  `/cash-registers/${registerId}/reject`,
  accountant.token,
  {},
);
check('رد بدون علت رد می‌شود', noReason.status === 400);

const rejected = await call(
  'POST',
  `/cash-registers/${registerId}/reject`,
  accountant.token,
  { comment: 'مبلغ کارتخوان با رسید همخوانی ندارد.' },
);
check('رد صندوق با علت', rejected.status === 201);

const unread = await call(
  'GET',
  '/notifications/unread-count',
  cashier.token,
);
check('صندوقدار اعلان می‌گیرد', unread.body?.count >= 1);

const otherNotifs = await call('GET', '/notifications', cashier2.token);
check(
  'اعلان‌ها بین کاربران جدا هستند',
  !otherNotifs.body?.items?.some((n) =>
    n.message?.includes('همخوانی ندارد'),
  ),
);

// اصلاح و ارسال دوباره
await call('PATCH', `/cash-registers/${registerId}/draft`, cashier.token, {
  transactions: [
    { type: 'sales_total', amount: 16_000_000 },
    { type: 'goods_return', amount: 1_000_000 },
    { type: 'cash', amount: 8_000_000 },
    { type: 'pos', amount: 7_000_000 },
  ],
});
const reClosed = await call(
  'PATCH',
  `/cash-registers/${registerId}/close`,
  cashier.token,
);
check('ارسال دوبارهٔ صندوق اصلاح‌شده', reClosed.status === 200);

const versions = await call(
  'GET',
  `/cash-registers/${registerId}/versions`,
  accountant.token,
);
check('دو نسخه ثبت شده', versions.body?.length === 2, `${versions.body?.length}`);

const compare = await call(
  'GET',
  `/cash-registers/${registerId}/versions/compare`,
  accountant.token,
);
const posDiff = compare.body?.diff?.transactions?.find((t) => t.type === 'pos');
check(
  'Diff تغییر کارتخوان را نشان می‌دهد',
  posDiff?.kind === 'changed' &&
    posDiff?.before?.amount === '9000000' &&
    posDiff?.after?.amount === '7000000',
  `${posDiff?.before?.amount} → ${posDiff?.after?.amount}`,
);

const salesDiff = compare.body?.diff?.transactions?.find(
  (t) => t.type === 'sales_total',
);
check('قلم بدون تغییر unchanged است', salesDiff?.kind === 'unchanged');

const approved = await call(
  'POST',
  `/cash-registers/${registerId}/approve`,
  accountant.token,
  { comment: 'اصلاح انجام شد.' },
);
check('تأیید صندوق', approved.status === 201);

const reReject = await call(
  'POST',
  `/cash-registers/${registerId}/reject`,
  accountant.token,
  { comment: 'خطای دیگری کشف شد و نیاز به بررسی دارد.' },
);
check('صندوق تأییدشده قابل بازگرداندن است', reReject.status === 201);

// ══════════════ جداسازی مستأجر ══════════════
section('امنیت — جداسازی مستأجر');

const peek = await call(
  'GET',
  `/cash-registers/${registerId}`,
  cashier2.token,
);
check('صندوقدار دیگر به صندوق دسترسی ندارد', peek.status === 403);

const regCashier = await login(`reg_${RUN}`, 'Reg@1404');
const crossBranch = await call(
  'GET',
  '/pos-terminals',
  regCashier.token,
);
check(
  'صندوقدار فقط کارتخوان شعبهٔ خودش را می‌بیند',
  crossBranch.body?.every((t) => t.branchId === branchId),
  `${crossBranch.body?.length} دستگاه`,
);

// ══════════════ گزارش ══════════════
const failed = results.filter((r) => !r.ok);
const bySection = new Map();
for (const r of results) {
  const list = bySection.get(r.section) ?? [];
  list.push(r);
  bySection.set(r.section, list);
}

for (const [name, items] of bySection) {
  const ok = items.filter((i) => i.ok).length;
  console.log(`\n${name}  (${ok}/${items.length})`);
  for (const item of items) {
    const mark = item.ok ? '✓' : '✗';
    const detail = item.detail ? ` — ${item.detail}` : '';
    console.log(`  ${mark} ${item.label}${detail}`);
  }
}

console.log(
  `\n${'═'.repeat(50)}\nمجموع: ${results.length - failed.length}/${results.length} موفق`,
);

if (failed.length > 0) {
  console.log(`\n❌ ${failed.length} تست ناموفق:`);
  for (const f of failed) console.log(`   [${f.section}] ${f.label}`);
  process.exitCode = 1;
}
