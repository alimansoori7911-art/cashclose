-- مدیر سامانه و کد کسب‌وکار.
--
-- مدیر سامانه جدول جداست و `tenantId` ندارد: اگر داخل `users` می‌آمد،
-- ناچار بودیم آن ستون را اختیاری کنیم و همان ستون پایهٔ جداسازی دادهٔ
-- همهٔ مشتریان است.

CREATE TABLE "platform_admins" (
    "id" UUID NOT NULL,
    "username" VARCHAR(80) NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_admins_username_key" ON "platform_admins"("username");

-- کد کسب‌وکار در دو گام اضافه می‌شود: NOT NULL + UNIQUE روی جدولی که
-- داده دارد، بدون مقدار اولیه شکست می‌خورد.
ALTER TABLE "tenants" ADD COLUMN "code" VARCHAR(12);
ALTER TABLE "tenants" ADD COLUMN "created_by_id" UUID;

-- کد موقت از هشت رقم اول شناسه؛ مدیر می‌تواند بعداً تغییرش دهد.
UPDATE "tenants"
SET "code" = UPPER(SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 8))
WHERE "code" IS NULL;

ALTER TABLE "tenants" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

ALTER TABLE "tenants" ADD CONSTRAINT "tenants_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "platform_admins"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
