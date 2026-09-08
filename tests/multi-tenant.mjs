/**
 * آزمون جداسازی چندمستأجری.
 *
 * مهم‌ترین خاصیت امنیتی سامانه: هیچ مجموعه‌ای نباید دادهٔ مجموعهٔ دیگر
 * را ببیند یا تغییر دهد. نشت اینجا یعنی فروشگاه الف فروش فروشگاه ب را
 * می‌بیند — فاجعه‌ای که با یک کوئری بدون `tenantId` رخ می‌دهد.
 *
 * پیش‌نیاز: مستأجر دوم ساخته شده باشد
 *   node dist/prisma/seed/second-tenant.js
 */

const BASE = process.env.API_BASE ?? 'http://localhost:3000/api/v1';
const results = [];

/** شناسه‌های ثابت seed — باید با فایل‌های seed یکی بمانند. */
const TENANT_ONE = '7eacf9a9-f84d-408d-9584-f498434e468b';
const TENANT_TWO = 'c3f1b8e2-9d47-4a56-b1e0-7f2a5c8d3e94';

function check(label, condition, detail = '') {
  results.push({ label, ok: Boolean(condition), detail });
}

async function call(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

async function login(username, tenantId) {
  const res = await call('POST', '/auth/login', null, {
    username,
    password: 'Cashclose@1404',
    ...(tenantId ? { tenantId } : {}),
  });
  return res;
}

// ─── تشخیص مجموعه از زیردامنه ───
//
// `fetch` اجازهٔ تعیین هدر Host را نمی‌دهد (هدر ممنوعه است)، پس درخواست
// خام HTTP ساخته می‌شود. این همان مسیری است که در استقرار واقعی طی
// می‌شود: کاربر با آدرس اختصاصی مجموعه‌اش می‌آید.
async function loginWithHost(host, username = 'owner') {
  const { default: http } = await import('node:http');
  const url = new URL(BASE);

  return new Promise((resolve) => {
    const payload = JSON.stringify({ username, password: 'Cashclose@1404' });
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: `${url.pathname}/auth/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Host: host,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = {};
          try {
            json = JSON.parse(data);
          } catch {
            /* غیر JSON */
          }
          resolve({ status: res.statusCode, body: json });
        });
      },
    );
    req.on('error', () => resolve({ status: 0, body: {} }));
    req.write(payload);
    req.end();
  });
}

const viaSlugOne = await loginWithHost('rahavi.cashclose.ir');
check(
  'زیردامنهٔ مجموعهٔ اول بدون شناسه وارد می‌کند',
  viaSlugOne.status === 200,
  viaSlugOne.body?.user?.fullName,
);

const viaSlugTwo = await loginWithHost('dovom.cashclose.ir');
check(
  'زیردامنهٔ مجموعهٔ دوم کاربر دیگری می‌آورد',
  viaSlugTwo.status === 200 &&
    viaSlugTwo.body?.user?.id !== viaSlugOne.body?.user?.id,
  viaSlugTwo.body?.user?.fullName,
);

const viaUnknown = await loginWithHost('unknown.cashclose.ir');
check(
  'زیردامنهٔ ناشناخته وارد نمی‌کند',
  viaUnknown.status === 401,
  `وضعیت: ${viaUnknown.status}`,
);

// ─── ورود مبهم ───

const ambiguous = await login('owner');
check(
  'نام کاربری مشترک بدون شناسهٔ مجموعه رد می‌شود',
  ambiguous.status === 401 && ambiguous.body?.message?.includes('چند مجموعه'),
  ambiguous.body?.message,
);

const first = await login('owner', TENANT_ONE);
check('ورود به مجموعهٔ اول با شناسه', first.status === 200);

const second = await login('owner', TENANT_TWO);
check('ورود به مجموعهٔ دوم با شناسه', second.status === 200);

check(
  'دو ورود، دو کاربر متفاوت‌اند',
  first.body?.user?.id !== second.body?.user?.id,
  `${first.body?.user?.fullName} ≠ ${second.body?.user?.fullName}`,
);

const tokenOne = first.body?.accessToken;
const tokenTwo = second.body?.accessToken;

if (!tokenOne || !tokenTwo) {
  console.error('ورود ناموفق بود؛ ادامهٔ آزمون ممکن نیست.');
  console.error('آیا مستأجر دوم ساخته شده است؟ (second-tenant.js)');
  process.exit(1);
}

// ─── جداسازی فهرست‌ها ───

const branchesOne = await call('GET', '/branches?limit=100', tokenOne);
const branchesTwo = await call('GET', '/branches?limit=100', tokenTwo);

const namesOne = (branchesOne.body?.items ?? []).map((b) => b.name);
const namesTwo = (branchesTwo.body?.items ?? []).map((b) => b.name);

check(
  'هر مجموعه فقط شعبه‌های خودش را می‌بیند',
  namesOne.length > 0 &&
    namesTwo.length > 0 &&
    !namesOne.some((n) => namesTwo.includes(n)),
  `اول: ${namesOne.length} شعبه، دوم: ${namesTwo.length} شعبه`,
);

const usersOne = await call('GET', '/users?limit=100', tokenOne);
const usersTwo = await call('GET', '/users?limit=100', tokenTwo);

const idsOne = new Set((usersOne.body?.items ?? []).map((u) => u.id));
const idsTwo = (usersTwo.body?.items ?? []).map((u) => u.id);

check(
  'کاربران دو مجموعه هیچ اشتراکی ندارند',
  idsTwo.length > 0 && !idsTwo.some((id) => idsOne.has(id)),
  `اول: ${idsOne.size} کاربر، دوم: ${idsTwo.length} کاربر`,
);

// ─── دسترسی مستقیم به شناسهٔ مجموعهٔ دیگر ───

const foreignBranch = (branchesTwo.body?.items ?? [])[0];

if (foreignBranch) {
  const stolen = await call('GET', `/branches/${foreignBranch.id}`, tokenOne);
  check(
    'شعبهٔ مجموعهٔ دیگر با شناسهٔ مستقیم قابل خواندن نیست',
    stolen.status === 404 || stolen.status === 403,
    `وضعیت: ${stolen.status}`,
  );

  const edited = await call(
    'PATCH',
    `/branches/${foreignBranch.id}`,
    tokenOne,
    { name: 'دستکاری‌شده' },
  );
  check(
    'شعبهٔ مجموعهٔ دیگر قابل تغییر نیست',
    edited.status === 404 || edited.status === 403,
    `وضعیت: ${edited.status}`,
  );
}

// ─── گزارش‌ها ───

const reportOne = await call('GET', '/reports/status-summary', tokenOne);
const reportTwo = await call('GET', '/reports/status-summary', tokenTwo);

check('گزارش هر دو مجموعه در دسترس است', reportOne.status === 200 && reportTwo.status === 200);

const approvedTwo = reportTwo.body?.approved?.count ?? 0;
check(
  'مجموعهٔ تازه صندوق تأییدشده ندارد',
  approvedTwo === 0,
  `${approvedTwo} صندوق`,
);

// ─── توکن جعلی با شناسهٔ مجموعهٔ دیگر ───

const terminalsOne = await call('GET', '/pos-terminals', tokenOne);
const terminalsTwo = await call('GET', '/pos-terminals', tokenTwo);

const termIdsOne = new Set((terminalsOne.body ?? []).map((t) => t.id));
const termIdsTwo = (terminalsTwo.body ?? []).map((t) => t.id);

check(
  'کارتخوان‌های دو مجموعه جدا هستند',
  termIdsTwo.length > 0 && !termIdsTwo.some((id) => termIdsOne.has(id)),
  `اول: ${termIdsOne.size}، دوم: ${termIdsTwo.length}`,
);

// ─── گزارش ───
const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log('\n' + '═'.repeat(50));
console.log(`مجموع: ${results.length - failed.length}/${results.length} موفق`);
if (failed.length > 0) process.exitCode = 1;
