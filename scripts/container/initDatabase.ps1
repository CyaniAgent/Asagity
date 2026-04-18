param(
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$composeDir = Join-Path $projectRoot 'container\docker'
$envFile = Join-Path $projectRoot '.env'
$installScript = Join-Path $projectRoot 'scripts\InstallDB.ps1'
$backupSuffix = Get-Date -Format 'yyyyMMddHHmmss'

function Get-EnvValue {
    param([string]$Key, [string]$Fallback)
    if (Test-Path $envFile) {
        $line = Get-Content $envFile | Where-Object { $_ -match "^$Key=" } | Select-Object -Last 1
        if ($null -ne $line -and $line.Length -gt 0) {
            return $line.Substring($Key.Length + 1)
        }
    }
    return $Fallback
}

function Prompt-Value {
    param([string]$Label, [string]$Current)
    $value = Read-Host "$Label [$Current]"
    if ([string]::IsNullOrWhiteSpace($value)) { return $Current }
    return $value
}

function Detect-PostgresPort {
    $defaultPort = "5432"
    try {
        $result = netstat -tlnp 2>$null | Where-Object { $_ -match ':(5432|5433)\s' } | Select-Object -First 1
        if ($result -match ':(\d+)\s') {
            return $matches[1]
        }
    } catch {}
    return $defaultPort
}

function Detect-RedisPort {
    $defaultPort = "6379"
    try {
        $result = netstat -tlnp 2>$null | Where-Object { $_ -match ':(6379|6380)\s' } | Select-Object -First 1
        if ($result -match ':(\d+)\s') {
            return $matches[1]
        }
    } catch {}
    return $defaultPort
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Asagity Database Configuration" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$dbHost = Get-EnvValue 'DB_HOST' '127.0.0.1'
$dbPort = Get-EnvValue 'DB_PORT' '5432'
$dbUser = Get-EnvValue 'DB_USER' 'asagity'
$dbPassword = Get-EnvValue 'DB_PASSWORD' 'example_password'
$dbName = Get-EnvValue 'DB_NAME' 'asagity_db'
$redisHost = Get-EnvValue 'REDIS_HOST' '127.0.0.1'
$redisPort = Get-EnvValue 'REDIS_PORT' '6379'
$redisPassword = Get-EnvValue 'REDIS_PASSWORD' ''
$serverPort = Get-EnvValue 'SERVER_PORT' '2048'
$webPort = Get-EnvValue 'WEB_PORT' '2000'
$tz = Get-EnvValue 'TZ' 'Asia/Shanghai'
$jwtSecret = Get-EnvValue 'JWT_SECRET' 'asagity_secret_miku_39'
$driveStoragePath = Get-EnvValue 'DRIVE_STORAGE_PATH' '/app/storage/drive'

Write-Host "Phase 1: Port Detection" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
$detectedPgPort = Detect-PostgresPort
$detectedRdPort = Detect-RedisPort
Write-Host "Detected PostgreSQL port: $detectedPgPort" -ForegroundColor Cyan
Write-Host "Detected Redis port:      $detectedRdPort" -ForegroundColor Cyan

$portMismatch = $false
if ($detectedPgPort -ne $dbPort) {
    Write-Host "[WARN] .env DB_PORT ($dbPort) differs from detected ($detectedPgPort)" -ForegroundColor Yellow
    $portMismatch = $true
}
if ($detectedRdPort -ne $redisPort) {
    Write-Host "[WARN] .env REDIS_PORT ($redisPort) differs from detected ($detectedRdPort)" -ForegroundColor Yellow
    $portMismatch = $true
}
Write-Host "-------------------------------------------" -ForegroundColor Gray

if ($portMismatch) {
    Write-Host ""
    $reconfig = Read-Host "Ports mismatch detected. Reconfigure? (Y/n)"
    if ($reconfig -ne 'n' -and $reconfig -ne 'N') {
        $dbPort = $detectedPgPort
        $redisPort = $detectedRdPort
        Write-Host "Using detected ports." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Phase 2: Connection Testing" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$postgresOnline = $false
$redisOnline = $false

if (Test-Command 'pg_isready') {
    $pgResult = pg_isready -h $dbHost -p $dbPort -U $dbUser -d $dbName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] PostgreSQL connection successful" -ForegroundColor Green
        $postgresOnline = $true
    } else {
        Write-Host "[FAIL] PostgreSQL connection failed" -ForegroundColor Red
        Write-Host "  This may indicate: wrong user, password, or database name" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] pg_isready not found" -ForegroundColor Gray
}

if (Test-Command 'redis-cli') {
    if ([string]::IsNullOrWhiteSpace($redisPassword)) {
        $redisResult = redis-cli -h $redisHost -p $redisPort ping 2>$null
    } else {
        $redisResult = redis-cli -h $redisHost -p $redisPort -a $redisPassword ping 2>$null
    }
    if ($redisResult -match "PONG") {
        Write-Host "[OK] Redis connection successful" -ForegroundColor Green
        $redisOnline = $true
    } else {
        Write-Host "[FAIL] Redis connection failed" -ForegroundColor Red
    }
} else {
    Write-Host "[SKIP] redis-cli not found" -ForegroundColor Gray
}
Write-Host "-------------------------------------------" -ForegroundColor Gray

if (-not $postgresOnline -or -not $redisOnline) {
    Write-Host ""
    Write-Host "Phase 3: Database Installation" -ForegroundColor Yellow
    Write-Host "[WARN] One or more database services are offline!" -ForegroundColor Red

    if (-not $SkipInstall) {
        Write-Host ""
        $installChoice = Read-Host "Install database now? (Y/n)"
        if ([string]::IsNullOrWhiteSpace($installChoice) -or $installChoice -match '^[Yy]$') {
            if (Test-Path $installScript) {
                Write-Host "Starting database installation..." -ForegroundColor Cyan
                & $installScript
            } else {
                Write-Host "Error: InstallDB.ps1 not found" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "Please ensure PostgreSQL and Redis are running manually." -ForegroundColor Yellow
            exit 0
        }
    }
}

Write-Host ""
Write-Host "Phase 4: Configuration Update" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray
Write-Host "Current .env:" -ForegroundColor White
Write-Host "  PostgreSQL: $dbHost`:$dbPort ($dbUser/$dbName)" -ForegroundColor White
Write-Host "  Redis:      $redisHost`:$redisPort" -ForegroundColor White
Write-Host "  API Server: $serverPort" -ForegroundColor White
Write-Host "  Web Front:  $webPort" -ForegroundColor White
Write-Host ""

$updateChoice = Read-Host "Update configuration? (Y/n)"
if ($updateChoice -eq 'n' -or $updateChoice -eq 'N') {
    Write-Host "Keeping existing configuration." -ForegroundColor Gray
} else {
    Write-Host "Enter new values (press Enter to keep current):" -ForegroundColor Cyan

    $dbHost = Prompt-Value "PostgreSQL host" $dbHost
    $dbPort = Prompt-Value "PostgreSQL port" $dbPort
    $dbUser = Prompt-Value "PostgreSQL user" $dbUser
    $dbPassword = Prompt-Value "PostgreSQL password" $dbPassword
    $dbName = Prompt-Value "PostgreSQL database" $dbName
    $redisHost = Prompt-Value "Redis host" '127.0.0.1'
    $redisPort = Prompt-Value "Redis port" $redisPort
    $redisPassword = Prompt-Value "Redis password (empty = none)" $redisPassword
    $redisDb = Prompt-Value "Redis database index" '0'
    $serverPort = Prompt-Value "API server port" $serverPort
    $webPort = Prompt-Value "Web frontend port" $webPort
    $tz = Prompt-Value "Timezone" $tz
    $driveStoragePath = Prompt-Value "Storage path" $driveStoragePath

    if (Test-Path $envFile) {
        Copy-Item $envFile "$envFile.$backupSuffix.bak" -Force
    }

    $content = @(
        "# Asagity Configuration",
        "TZ=$tz",
        "",
        "# Server Ports",
        "SERVER_PORT=$serverPort",
        "WEB_PORT=$webPort",
        "",
        "# PostgreSQL",
        "DB_HOST=$dbHost",
        "DB_PORT=$dbPort",
        "DB_USER=$dbUser",
        "DB_PASSWORD=$dbPassword",
        "DB_NAME=$dbName",
        "",
        "POSTGRES_PORT=$dbPort",
        "POSTGRES_USER=$dbUser",
        "POSTGRES_PASSWORD=$dbPassword",
        "POSTGRES_DB=$dbName",
        "",
        "# Redis",
        "REDIS_HOST=$redisHost",
        "REDIS_ADDR=$redisHost`:$redisPort",
        "REDIS_PASSWORD=$redisPassword",
        "REDIS_DB=$redisDb",
        "REDIS_PORT=$redisPort",
        "",
        "# Security",
        "JWT_SECRET=$jwtSecret",
        "",
        "# Storage",
        "DRIVE_STORAGE_PATH=$driveStoragePath"
    )

    Set-Content -Path $envFile -Value $content -Encoding UTF8
    Write-Host "Configuration written to $envFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL: $dbHost`:$dbPort ($dbName)" -ForegroundColor Cyan
Write-Host "Redis:      $redisHost`:$redisPort" -ForegroundColor Cyan
Write-Host "API Server: $serverPort" -ForegroundColor Cyan
Write-Host "Web Front:  $webPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: cd $projectRoot\core; go run ." -ForegroundColor Yellow