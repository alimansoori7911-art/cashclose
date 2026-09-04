/**
 * تست انتها‌به‌انتهای فاز ۶ — گزارش‌های مدیریتی.
 *
 * پیش‌نیاز: دادهٔ تاریخچه ساخته شده باشد
 *   npm run db:demo-history --workspace @cashclose/api
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

async function call(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
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

const owner = await login('owner');
const manager = await login('manager');
const cashier = await login('cashier1');
const accountant = await login('accountant');

// ─── دسترسی نقش‌ها ───
check(
  'مالک به گزارش‌ها دسترسی دارد',
  (await call('/reports/daily-sales', owner)).status === 200,
);
check(
  'مدیر فروشگاه به گزارش‌ها دسترسی دارد',
  (await call('/reports/daily-sales', manager)).status === 200,
);
check(
  'صندوقدار به گزارش‌ها دسترسی ندارد',
  (await call('/reports/daily-sales', cashier)).status === 403,
);
check(
  'حسابدار به گزارش‌ها دسترسی ندارد',
  (await call('/reports/daily-sales', accountant)).status === 403,
);

// ─── فروش روزانه ───
const daily = await call('/reports/daily-sales', owner);
check('گزارش فروش روزانه', daily.status === 200);
check(
  'داده‌های چندروزه برمی‌گردد',
  Array.isArray(daily.body) && daily.body.length > 20,
  `${daily.body?.length} روز`,
);

const firstDay = daily.body?.[0];
check(
  'هر روز مبلغ فروش دارد',
  typeof firstDay?.sales === 'number' && firstDay.sales > 0,
  `${firstDay?.date}: ${firstDay?.sales?.toLocaleString('fa-IR')}`,
);
check(
  'تاریخ‌ها صعودی مرتب‌اند',
  daily.body?.every(
    (item, i) => i === 0 || item.date >= daily.body[i - 1].date,
  ),
);
check(
  'چند صندوق یک روز با هم جمع می‌شوند',
  daily.body?.some((d) => d.registerCount > 1),
  `بیشترین: ${Math.max(...(daily.body?.map((d) => d.registerCount) ?? [0]))} صندوق در روز`,
);

// ─── فیلتر تاریخ ───
const iso = (d) => d.toISOString().slice(0, 10);
const from = iso(new Date(Date.now() - 10 * 86400000));
const filtered = await call(`/reports/daily-sales?dateFrom=${from}`, owner);
check(
  'فیلتر تاریخ کار می‌کند',
  filtered.body?.length < daily.body?.length,
  `${filtered.body?.length} از ${daily.body?.length} روز`,
);
check(
  'همهٔ نتایج در بازهٔ خواسته‌شده‌اند',
  filtered.body?.every((d) => d.date >= from),
);

const badDate = await call('/reports/daily-sales?dateFrom=not-a-date', owner);
check('تاریخ نامعتبر رد می‌شود', badDate.status === 400);

// ─── مقایسهٔ شعبه‌ها ───
const branches = await call('/reports/branch-comparison', owner);
check('گزارش مقایسهٔ شعبه‌ها', branches.status === 200);
check(
  'هر دو شعبه در گزارش هستند',
  branches.body?.length >= 2,
  branches.body?.map((b) => b.branchName).join('، '),
);
check(
  'شعبه‌ها بر اساس فروش نزولی مرتب‌اند',
  branches.body?.every(
    (b, i) => i === 0 || b.sales <= branches.body[i - 1].sales,
  ),
);

// ─── خلاصهٔ وضعیت ───
const status = await call('/reports/status-summary', owner);
check('گزارش خلاصهٔ وضعیت', status.status === 200);
check(
  'همهٔ چهار وضعیت کلید دارند',
  ['draft', 'submitted', 'approved', 'rejected'].every(
    (key) => key in (status.body ?? {}),
  ),
);
check(
  'شمار صندوق‌های تأییدشده درست است',
  status.body?.approved?.count > 100,
  `${status.body?.approved?.count} صندوق`,
);

// ─── پیش‌بینی ماهانه ───
const forecast = await call('/reports/monthly-forecast', owner);
check('گزارش پیش‌بینی ماهانه', forecast.status === 200);
check(
  'میانگین روزانه محاسبه شده',
  forecast.body?.dailyAverage > 0,
  `${forecast.body?.dailyAverage?.toLocaleString('fa-IR')} ریال/روز`,
);
check(
  'فرمول پیش‌بینی درست است (میانگین × روزهای ماه)',
  forecast.body?.projectedTotal ===
    forecast.body?.dailyAverage * forecast.body?.daysInMonth,
  `${forecast.body?.projectedTotal?.toLocaleString('fa-IR')}`,
);
check(
  'روزهای باقی‌مانده منطقی است',
  forecast.body?.daysRemaining >= 0 &&
    forecast.body?.daysRemaining < forecast.body?.daysInMonth,
  `${forecast.body?.daysRemaining} روز مانده`,
);
check(
  'طول ماه شمسی درست است',
  [29, 30, 31].includes(forecast.body?.daysInMonth),
  `${forecast.body?.daysInMonth} روز`,
);

const badMonth = await call('/reports/monthly-forecast?month=13', owner);
check('ماه نامعتبر رد می‌شود', badMonth.status === 400);

// ─── روند ماهانه ───
const trend = await call('/reports/monthly-trend', owner);
check('گزارش روند ماهانه', trend.status === 200);
check(
  'هر ۱۲ ماه برمی‌گردد',
  trend.body?.months?.length === 12,
  `${trend.body?.months?.length} ماه`,
);
check(
  'ماه‌های دارای داده مبلغ دارند',
  trend.body?.months?.some((m) => m.sales > 0),
);

// ─── مازاد و کسری ───
const surplus = await call('/reports/surplus-shortage', owner);
check('گزارش مازاد و کسری', surplus.status === 200);
check(
  'اقلام مازاد ثبت‌شده دیده می‌شوند',
  surplus.body?.surplusTotal > 0,
  `مازاد: ${surplus.body?.surplusTotal?.toLocaleString('fa-IR')}`,
);

// ─── خرید بدون تسویه ───
const unsettled = await call('/reports/unsettled-purchases', owner);
check('گزارش خرید بدون تسویه', unsettled.status === 200);
check(
  'اقلام بدهی دیده می‌شوند',
  unsettled.body?.count > 0,
  `${unsettled.body?.count} مورد، جمع ${unsettled.body?.total?.toLocaleString('fa-IR')}`,
);
check(
  'هر قلم تاریخ و شعبه دارد',
  unsettled.body?.items?.[0]?.date && unsettled.body?.items?.[0]?.branchName,
);

// ─── صندوق‌های مشکل‌دار ───
const problematic = await call('/reports/problematic', owner);
check('گزارش صندوق‌های چندبار ردشده', problematic.status === 200);
check('خروجی آرایه است', Array.isArray(problematic.body));

// ─── جداسازی مستأجر ───
const branchIds = branches.body?.map((b) => b.branchId) ?? [];
const scoped = await call(
  `/reports/daily-sales?branchId=${branchIds[0]}`,
  owner,
);
check(
  'فیلتر شعبه فروش کمتری برمی‌گرداند',
  scoped.body?.[0]?.sales < daily.body?.[0]?.sales,
  'داده فقط یک شعبه',
);

// ─── گزارش ───
const failed = results.filter((r) => !r.ok);

console.log('\nفاز ۶ — گزارش‌های مدیریتی\n' + '─'.repeat(52));
for (const r of results) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`);
}

console.log(
  `\n${'═'.repeat(52)}\nمجموع: ${results.length - failed.length}/${results.length} موفق`,
);

if (failed.length > 0) {
  console.log('\n❌ ناموفق:');
  for (const f of failed) console.log(`   ${f.label}`);
  process.exitCode = 1;
}
