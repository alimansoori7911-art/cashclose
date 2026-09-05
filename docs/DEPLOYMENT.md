# راهنمای استقرار روی سرور

قدم‌به‌قدم، از سرور خالی تا سامانهٔ در حال کار.

> **پیش‌فرض:** سرور لینوکسی (Ubuntu/Debian) با دسترسی `sudo` و اتصال SSH.

---

## ۱. نصب داکر

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
```

فعال‌کردن سرویس و اجازهٔ استفاده بدون `sudo`:

```bash
sudo systemctl enable --now docker && sudo usermod -aG docker $USER
```

سپس **یک‌بار از SSH خارج و دوباره وارد شوید** تا عضویت گروه اعمال شود.
بررسی:

```bash
docker run --rm hello-world
```

پیام `Hello from Docker!` یعنی همه‌چیز آماده است.

---

## ۲. گرفتن کد

```bash
git clone https://github.com/alimansoori7911-art/cashclose.git
cd cashclose
```

اگر مخزن خصوصی است، گیت رمز می‌خواهد. به‌جای رمز حساب، از
[Personal Access Token](https://github.com/settings/tokens) استفاده کنید.

---

## ۳. ساخت فایل تنظیمات

```bash
cp .env.docker.example .env
```

حالا مقادیر را بسازید. این دو دستور رمزهای تصادفی تولید می‌کنند:

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 48)"
```

خروجی را در `.env` بگذارید و `CORS_ORIGINS` را هم پر کنید:

```bash
nano .env
```

| متغیر | مقدار |
|---|---|
| `POSTGRES_PASSWORD` | خروجی دستور بالا |
| `JWT_SECRET` | خروجی دستور بالا |
| `CORS_ORIGINS` | آدرسی که کاربران با آن وصل می‌شوند، مثلاً `https://cashclose.example.com` |
| `WEB_PORT` | اگر پورت ۸۰ آزاد است همان بماند |

> ⚠️ در محیط تولید، `CORS_ORIGINS` **باید** با `https` شروع شود. اگر
> `http` بگذارید سرویس عمداً بالا نمی‌آید (توکن روی HTTP رمزنگاری‌نشده
> منتقل می‌شود) و در لاگ می‌بینید:
>
> ```
> پیکربندی برای محیط تولید امن نیست:
>   • همهٔ مقادیر CORS_ORIGINS در تولید باید https باشند.
> ```
>
> **برای اولین استقرار** که هنوز دامنه و گواهی ندارید، این خط را به
> `.env` اضافه کنید:
>
> ```
> NODE_ENV=development
> ```
>
> پس از راه‌اندازی HTTPS (بخش ۵)، همین خط را **حذف کنید** تا محافظ‌های
> محیط تولید دوباره فعال شوند.

### اگر پورت ۸۰ اشغال است

سرویس دیگری (یا پروژه‌ای دیگر) ممکن است از قبل روی این پورت باشد:

```bash
sudo ss -tlnp | grep ':80 '
```

در این حالت پورت دیگری بردارید — نیازی به متوقف‌کردن آن سرویس نیست:

```bash
sed -i "s|^WEB_PORT=.*|WEB_PORT=8080|" .env
sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=http://<آی‌پی سرور>:8080|" .env
```

---

## ۴. اجرا

```bash
docker compose up -d --build
```

بار اول چند دقیقه طول می‌کشد (دانلود تصویرها و بیلد). بررسی وضعیت:

```bash
docker compose ps
```

هر سه سرویس باید `healthy` یا `running` باشند.

### ساخت کاربر اولیه

مهاجرت‌ها خودکار اجرا شده‌اند، ولی هنوز کاربری وجود ندارد:

```bash
docker compose exec api node dist/prisma/seed/index.js
```

این کار فروشگاه، شعبه و پنج کاربر نمونه می‌سازد. **رمز همهٔ آن‌ها
`Cashclose@1404` است — بلافاصله پس از اولین ورود عوضشان کنید.**

حالا سامانه روی `http://<آی‌پی سرور>` بالا است.

---

## ۵. HTTPS (اگر از اینترنت در دسترس است)

بدون HTTPS، رمز کاربران به‌صورت متن ساده در شبکه می‌رود. ساده‌ترین راه
Caddy است که گواهی را خودکار می‌گیرد و تمدید می‌کند:

```bash
sudo apt install -y caddy
```

فایل `/etc/caddy/Caddyfile`:

```
cashclose.example.com {
    reverse_proxy localhost:80
}
```

```bash
sudo systemctl reload caddy
```

پیش از این کار، رکورد `A` دامنه باید به IP سرور اشاره کند.

سپس در `.env` مقدار `CORS_ORIGINS` را به `https://cashclose.example.com`
تغییر دهید و `docker compose up -d` را دوباره بزنید.

### شبکهٔ داخلی فروشگاه

اگر سامانه فقط داخل شبکهٔ فروشگاه در دسترس است و دامنه ندارید، HTTPS
لازم نیست ولی باید `NODE_ENV` را از `production` خارج کنید — که
**توصیه نمی‌شود**. راه بهتر: یک دامنهٔ داخلی و گواهی خودامضا، یا دسترسی
از طریق VPN.

---

## نگهداری روزمره

### دیدن لاگ

```bash
docker compose logs -f api
```

برای پیدا کردن یک خطای خاص با کد پیگیری که کاربر داده:

```bash
docker compose logs api | grep "3f2504e0"
```

### پشتیبان‌گیری از دیتابیس

**مهم‌ترین کار نگهداری.** این را روی زمان‌بند بگذارید:

```bash
docker compose exec -T db pg_dump -U cashclose cashclose | gzip > backup-$(date +%F).sql.gz
```

بازگردانی:

```bash
gunzip -c backup-1405-06-14.sql.gz | docker compose exec -T db psql -U cashclose cashclose
```

عکس‌های رسید در volume جدا هستند:

```bash
docker run --rm -v cashclose_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

### پشتیبان خودکار روزانه

```bash
crontab -e
```

خط زیر را اضافه کنید (هر شب ساعت ۲):

```
0 2 * * * cd /home/cloud-admin/cashclose && docker compose exec -T db pg_dump -U cashclose cashclose | gzip > /home/cloud-admin/backups/db-$(date +\%F).sql.gz
```

پوشه را از قبل بسازید: `mkdir -p ~/backups`

### به‌روزرسانی به نسخهٔ جدید

```bash
cd cashclose
git pull
docker compose up -d --build
```

مهاجرت‌های دیتابیس خودکار اجرا می‌شوند. **پیش از هر به‌روزرسانی پشتیبان
بگیرید.**

### راه‌اندازی مجدد

```bash
docker compose restart api      # فقط بک‌اند
docker compose restart          # همه
```

---

## عیب‌یابی

| نشانه | علت محتمل | راه‌حل |
|---|---|---|
| `api` مدام ری‌استارت می‌شود | خطای تنظیمات | `docker compose logs api` — پیام فارسی دقیق می‌گوید کدام متغیر ایراد دارد |
| صفحه باز می‌شود ولی ورود کار نمی‌کند | `CORS_ORIGINS` با آدرس واقعی یکی نیست | مقدار را دقیقاً برابر آدرس مرورگر بگذارید |
| `port is already allocated` | پورت ۸۰ اشغال است | `WEB_PORT=8080` در `.env` |
| بیلد روی سرور خیلی کند است | ۲ هسته CPU | بیلد را به CI بسپارید و تصویر آماده را pull کنید |
| فضای دیسک پر شد | تصویرهای قدیمی | `docker system prune -a` |

### بررسی سلامت دستی

```bash
curl http://localhost/api/v1/health/ready
```

پاسخ `{"status":"ok","database":"up",...}` یعنی همه‌چیز درست است.
