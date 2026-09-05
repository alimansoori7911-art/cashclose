# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# فرانت‌اند — بیلد ثابت + سرو با nginx
#
# خروجی React یک مشت فایل ثابت است و نیازی به Node در زمان اجرا ندارد.
# تصویر نهایی چند ده مگابایت است، نه چند صد.
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci --workspace @cashclose/web --workspace @cashclose/shared \
    --include-workspace-root

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm run build --workspace @cashclose/shared \
 && npm run build --workspace @cashclose/web

# ─── اجرا ───
FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
