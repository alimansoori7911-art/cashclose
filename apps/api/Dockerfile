# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# بک‌اند — ساخت چندمرحله‌ای
#
# چرا چندمرحله‌ای: ابزارهای بیلد (TypeScript، NestJS CLI) حدود ۳۰۰
# مگابایت‌اند و در زمان اجرا هیچ کاربردی ندارند. مرحلهٔ آخر فقط خروجی
# کامپایل‌شده و وابستگی‌های واقعی را برمی‌دارد.
# ─────────────────────────────────────────────────────────────

# ─── مرحلهٔ ۱: نصب وابستگی‌ها ───
FROM node:20-alpine AS deps

WORKDIR /app

# فقط فایل‌های تعریف وابستگی کپی می‌شوند تا وقتی کد تغییر می‌کند اما
# وابستگی‌ها ثابت‌اند، داکر از کش استفاده کند و دوباره نصب نکند.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# `npm ci` نه `npm install`: دقیقاً همان نسخه‌های lock نصب می‌شوند.
RUN npm ci --workspace @cashclose/api --workspace @cashclose/shared \
    --include-workspace-root

# ─── مرحلهٔ ۲: بیلد ───
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# کلاینت Prisma باید پیش از کامپایل ساخته شود؛ کد به تایپ‌هایش وابسته است.
RUN npm run db:generate --workspace @cashclose/api \
 && npm run build --workspace @cashclose/shared \
 && npm run build --workspace @cashclose/api

# `nest build` اسکریپت‌های seed را هم کامپایل می‌کند (در dist/prisma).
# پس در زمان اجرا به `tsx` نیازی نیست و ساخت کاربر اولیه با node انجام
# می‌شود — این تنها دلیلی بود که ابزار توسعه باید در تصویر می‌ماند.
RUN test -f apps/api/dist/prisma/seed/index.js \
    || (echo 'خروجی seed کامپایل نشد' && exit 1)

# وابستگی‌های توسعه حذف می‌شوند، جز Prisma CLI که برای `migrate deploy`
# هنگام بالا آمدن لازم است.
RUN npm prune --omit=dev \
 && npm install --no-save prisma@6

# ─── مرحلهٔ ۳: اجرا ───
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# اجرا با کاربر غیر‌root: اگر روزی نفوذی رخ دهد، دسترسی‌اش محدود بماند.
# تصویر node از پیش کاربر `node` را دارد.
RUN mkdir -p /app/uploads && chown -R node:node /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/packages/shared/package.json ./packages/shared/
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/
# اسکیما و مهاجرت‌ها لازم‌اند: هنگام بالا آمدن، `migrate deploy` اجرا می‌شود.
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma

USER node

EXPOSE 3000

# بررسی سلامت با مسیر `ready`: تا وقتی دیتابیس بالا نیامده، این کانتینر
# «آماده» شمرده نمی‌شود.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/apps/api

CMD ["node", "dist/src/main.js"]
