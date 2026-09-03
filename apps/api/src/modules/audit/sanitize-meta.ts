import { Prisma } from '@prisma/client';

import type { AuditMeta } from './audit.service';

/**
 * پاک‌سازی محتوای `meta` پیش از ذخیره در لاگ (بند ۱۰.۷ سند).
 *
 * سه کار انجام می‌دهد:
 *  ۱. کلیدهای حساس (رمز، توکن، هش) را با `[حذف‌شده]` جایگزین می‌کند —
 *     مهم‌ترین بخش: بدون آن، ویرایش کاربر می‌توانست رمز خام را در لاگ
 *     بنویسد.
 *  ۲. `undefined`ها را حذف می‌کند، چون Prisma آن‌ها را نمی‌پذیرد.
 *  ۳. عمق را محدود می‌کند تا شیء تودرتوی بزرگ، ستون JSON را پر نکند.
 */

const SENSITIVE_PATTERN =
  /password|passwd|secret|token|hash|authorization|cookie|apikey|api_key/i;

const REDACTED = '[حذف‌شده]';
const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 1000;

function sanitizeValue(value: unknown, depth: number): unknown {
  if (value === null) return null;
  if (depth > MAX_DEPTH) return '[عمق بیش از حد]';

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…`
      : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      out[key] = SENSITIVE_PATTERN.test(key)
        ? REDACTED
        : sanitizeValue(item, depth + 1);
    }
    return out;
  }

  // تابع، Symbol و مقادیر غیرقابل‌سریال‌سازی کنار گذاشته می‌شوند.
  return undefined;
}

export function sanitizeMeta(
  meta: AuditMeta | undefined,
): Prisma.InputJsonValue | undefined {
  if (!meta) return undefined;

  const sanitized = sanitizeValue(meta, 0);
  return sanitized === undefined
    ? undefined
    : (sanitized as Prisma.InputJsonValue);
}
