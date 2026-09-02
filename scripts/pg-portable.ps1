# Portable PostgreSQL control script (no administrator rights required).
#
# The official PostgreSQL installer registers a Windows service and needs
# admin rights. This script runs the same official binaries from a folder
# instead: no registry entries, no service, fully removable.
#
# Messages here are intentionally English: Windows PowerShell 5.1 reads
# script files using the system ANSI codepage, so Persian text in a UTF-8
# file without BOM gets mangled into a parse error.
#
# Usage:
#   .\scripts\pg-portable.ps1 start
#   .\scripts\pg-portable.ps1 stop
#   .\scripts\pg-portable.ps1 status

param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'status', 'init')]
    [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'

$PgBin = Join-Path $env:USERPROFILE 'pgsql-portable\pgsql\bin'
$PgData = Join-Path $env:USERPROFILE 'pgsql-portable\data'
$PgLog = Join-Path $env:USERPROFILE 'pgsql-portable\postgres.log'
$Port = 5432

function Assert-Binaries {
    if (-not (Test-Path (Join-Path $PgBin 'pg_ctl.exe'))) {
        throw "PostgreSQL binaries not found in $PgBin"
    }
}

function Test-PgReady {
    if (-not (Test-Path (Join-Path $PgBin 'pg_isready.exe'))) { return $false }
    & (Join-Path $PgBin 'pg_isready.exe') -p $Port -q 2>$null
    return $LASTEXITCODE -eq 0
}

function Initialize-Cluster {
    Assert-Binaries

    if (Test-Path (Join-Path $PgData 'PG_VERSION')) {
        Write-Host 'Database cluster already initialized.'
        return
    }

    Write-Host 'Initializing database cluster...'
    New-Item -ItemType Directory -Force -Path $PgData | Out-Null

    # Password is passed via a temp file so it never appears in the
    # command line or shell history.
    $pwFile = Join-Path $env:TEMP "pgpw_$([guid]::NewGuid().ToString('N')).txt"
    try {
        Set-Content -Path $pwFile -Value 'postgres' -NoNewline -Encoding ascii

        # initdb writes an informational warning to stderr, which
        # PowerShell 5.1 turns into a terminating NativeCommandError.
        # Suppressing ErrorAction here keeps the real exit code as the
        # only success signal.
        & (Join-Path $PgBin 'initdb.exe') `
            -D $PgData -U postgres --pwfile=$pwFile -E UTF8 --locale=C `
            -ErrorAction SilentlyContinue 2>&1 | Out-Null

        if ($LASTEXITCODE -ne 0) { throw "initdb failed with code $LASTEXITCODE" }
    }
    finally {
        if (Test-Path $pwFile) { Remove-Item $pwFile -Force }
    }

    Write-Host 'Database cluster created.' -ForegroundColor Green
}

function Start-Postgres {
    Assert-Binaries
    Initialize-Cluster

    if (Test-PgReady) {
        Write-Host "PostgreSQL is already running on port $Port."
        return
    }

    Write-Host 'Starting PostgreSQL...'
    & (Join-Path $PgBin 'pg_ctl.exe') -D $PgData -l $PgLog -o "-p $Port" -w start

    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Startup failed. Last log lines:' -ForegroundColor Red
        if (Test-Path $PgLog) { Get-Content $PgLog -Tail 20 }
        throw 'PostgreSQL failed to start.'
    }

    Write-Host "PostgreSQL running on port $Port." -ForegroundColor Green
}

function Stop-Postgres {
    Assert-Binaries
    & (Join-Path $PgBin 'pg_ctl.exe') -D $PgData -m fast -w stop
    Write-Host 'PostgreSQL stopped.'
}

function Get-Status {
    if (Test-PgReady) {
        Write-Host "Running (port $Port)" -ForegroundColor Green
    }
    else {
        Write-Host 'Stopped' -ForegroundColor Yellow
    }
}

switch ($Action) {
    'init' { Initialize-Cluster }
    'start' { Start-Postgres }
    'stop' { Stop-Postgres }
    'status' { Get-Status }
}
