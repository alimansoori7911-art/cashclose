/**
 * بررسی سقف ۱۵۰ خط برای هر فایل (قاعدهٔ ۱ در CLAUDE.md).
 *
 * چرا خودکار: این قاعده به‌مرور و بی‌سروصدا نقض می‌شود — یک تابع اینجا،
 * یک شرط آنجا. بررسی خودکار جلوی خزیدن تدریجی را می‌گیرد.
 *
 * اجرا: node scripts/check-file-size.mjs
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// `fileURLToPath` لازم است نه `.pathname`: مسیرهای دارای فاصله در URL
// به‌صورت %20 کدگذاری می‌شوند و مستقیم قابل استفاده نیستند.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MAX_LINES = 150;

/** پوشه‌هایی که اصلاً بررسی نمی‌شوند. */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.claude',
]);

/**
 * استثناهای ثبت‌شده در CLAUDE.md.
 *
 * هر افزودن به این فهرست باید در همان سند هم دلیلش نوشته شود.
 */
const EXEMPT = [
  // روابط بین جداول باید یکجا دیده شوند.
  /prisma[/\\]schema\.prisma$/,
  // فایل تست کنار کد خودش می‌ماند حتی اگر بلند شود.
  /\.(spec|test)\.(ts|tsx|mjs|js)$/,
  /^tests[/\\]/,
];

const EXTENSIONS = /\.(ts|tsx|mjs|js|jsx)$/;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(join(dir, entry.name));
    } else if (EXTENSIONS.test(entry.name)) {
      yield join(dir, entry.name);
    }
  }
}

const offenders = [];

for await (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (EXEMPT.some((pattern) => pattern.test(rel))) continue;

  const content = await readFile(file, 'utf8');
  const lines = content.split('\n').length;

  if (lines > MAX_LINES) offenders.push({ rel, lines });
}

if (offenders.length === 0) {
  console.log(`✓ هیچ فایلی از ${MAX_LINES} خط نگذشته است.`);
  process.exit(0);
}

console.error(`✗ ${offenders.length} فایل از سقف ${MAX_LINES} خط گذشته‌اند:\n`);
for (const { rel, lines } of offenders.sort((a, b) => b.lines - a.lines)) {
  console.error(`  ${String(lines).padStart(4)} خط  ${rel}`);
}
console.error(
  '\nفایل بلند یعنی بیش از یک مسئولیت. راهنمای شکستن در CLAUDE.md بند ۱.',
);
process.exit(1);
