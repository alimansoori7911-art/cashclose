# ساخت دیتابیس پروژه و اجرای migration و دادهٔ نمونه.
#
# پیش‌نیاز: PostgreSQL در حال اجرا باشد
#   .\scripts\pg-portable.ps1 start

$ErrorActionPreference = 'Stop'

$PgBin = Join-Path $env:USERPROFILE 'pgsql-portable\pgsql\bin'
$Psql = Join-Path $PgBin 'psql.exe'
$DbName = 'cashclose'

if (-not (Test-Path $Psql)) {
    throw "psql در $PgBin پیدا نشد. ابتدا PostgreSQL را نصب کنید."
}

# رمز از طریق متغیر محیطی به psql داده می‌شود تا در خط فرمان دیده نشود.
$env:PGPASSWORD = 'postgres'

try {
    Write-Host 'بررسی وجود دیتابیس...'
    $exists = & $Psql -U postgres -h localhost -tAc `
        "SELECT 1 FROM pg_database WHERE datname='$DbName'"

    if ($exists -eq '1') {
        Write-Host "دیتابیس «$DbName» از قبل وجود دارد."
    }
    else {
        & $Psql -U postgres -h localhost -c "CREATE DATABASE $DbName" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'ساخت دیتابیس ناموفق بود.' }
        Write-Host "دیتابیس «$DbName» ساخته شد." -ForegroundColor Green
    }
}
finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host 'اجرای migration...'
npm run db:migrate --workspace @cashclose/api
if ($LASTEXITCODE -ne 0) { throw 'migration ناموفق بود.' }

Write-Host ''
Write-Host 'ساخت دادهٔ نمونه...'
npm run db:seed
if ($LASTEXITCODE -ne 0) { throw 'seed ناموفق بود.' }

Write-Host ''
Write-Host 'دیتابیس آمادهٔ استفاده است.' -ForegroundColor Green
