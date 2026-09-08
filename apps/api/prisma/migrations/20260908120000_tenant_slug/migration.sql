-- افزودن شناسهٔ متنی (زیردامنه) به مجموعه‌ها.
--
-- ستون در دو گام اضافه می‌شود چون NOT NULL + UNIQUE روی جدولی که از
-- قبل داده دارد، بدون مقدار اولیه شکست می‌خورد.

-- گام ۱: ستون قابل خالی‌بودن
ALTER TABLE "tenants" ADD COLUMN "slug" VARCHAR(63);

-- گام ۲: مقدار موقت یکتا برای ردیف‌های موجود.
-- هشت رقم اول شناسه به‌عنوان زیردامنهٔ موقت به کار می‌رود؛ مدیر باید
-- بعداً آن را به نام معنادار مشتری تغییر دهد.
UPDATE "tenants"
SET "slug" = 'tenant-' || SUBSTRING("id"::text FROM 1 FOR 8)
WHERE "slug" IS NULL;

-- گام ۳: اعمال قیدها
ALTER TABLE "tenants" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
