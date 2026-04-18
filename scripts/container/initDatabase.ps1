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
    param(
        [string]$Key,
        [string]$Fallback
    )

    if (Test-Path $envFile) {
        $line = Get-Content $envFile | Where-Object { $_ -match "^$Key=" } | Select-Object -Last 1
        if ($null -ne $line -and $line.Length -gt 0) {
            return $line.Substring($Key.Length + 1)
        }
    }

    return $Fallback
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Prompt-Value {
    param(
        [string]$Label,
        [string]$Current
    )

    $value = Read-Host "$Label [$Current]"
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $Current
    }

    return $value
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

Write-Host "Current .env configuration:" -ForegroundColor Yellow
Write-Host "  PostgreSQL: $dbHost`:$dbPort ($dbName)" -ForegroundColor White
Write-Host "  Redis:      $redisHost`:$redisPort" -ForegroundColor White
Write-Host "  API Server: $serverPort" -ForegroundColor White
Write-Host "  Web Front:  $webPort" -ForegroundColor White
Write-Host ""

$updateChoice = Read-Host "Update configuration? (Y/n)"
if ($updateChoice -eq 'n' -or $updateChoice -eq 'N') {
    Write-Host "Keeping existing configuration." -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Enter new configuration values:" -ForegroundColor Cyan
    Write-Host ""

    $dbHost = Prompt-Value "PostgreSQL host" $dbHost
    $dbPort = Prompt-Value "PostgreSQL host port" $dbPort
    $dbUser = Prompt-Value "PostgreSQL user" $dbUser
    $dbPassword = Prompt-Value "PostgreSQL password" $dbPassword
    $dbName = Prompt-Value "PostgreSQL database name" $dbName
    $redisHost = Prompt-Value "Redis host" '127.0.0.1'
    $redisPort = Prompt-Value "Redis host port" $redisPort
    $redisPassword = Prompt-Value "Redis password (empty allowed)" $redisPassword
    $redisDb = Prompt-Value "Redis database index" '0'
    $serverPort = Prompt-Value "Asagity API server port" $serverPort
    $webPort = Prompt-Value "Asagity Web frontend port" $webPort
    $tz = Prompt-Value "Timezone" $tz

    Write-Host ""
    Write-Host "Advanced options (press Enter to use default):" -ForegroundColor Gray
    Write-Host "-------------------------------------------" -ForegroundColor Gray
    $driveStoragePath = Prompt-Value "Drive storage path" $driveStoragePath
    Write-Host "-------------------------------------------" -ForegroundColor Gray
    Write-Host ""

    if (Test-Path $envFile) {
        Copy-Item $envFile "$envFile.$backupSuffix.bak" -Force
        Write-Host "Backed up existing .env to .env.$backupSuffix.bak" -ForegroundColor Yellow
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
Write-Host "Checking database services status..." -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$postgresOnline = $false
$redisOnline = $false

if (Test-Command 'pg_isready') {
    $pgResult = pg_isready -h $dbHost -p $dbPort -U $dbUser -d $dbName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] PostgreSQL is online" -ForegroundColor Green
        $postgresOnline = $true
    } else {
        Write-Host "[OFFLINE] PostgreSQL is not accessible" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] pg_isready not found, cannot check PostgreSQL" -ForegroundColor Gray
}

if (Test-Command 'redis-cli') {
    if ([string]::IsNullOrWhiteSpace($redisPassword)) {
        $redisResult = redis-cli -h $redisHost -p $redisPort ping 2>$null
    } else {
        $redisResult = redis-cli -h $redisHost -p $redisPort -a $redisPassword ping 2>$null
    }
    if ($redisResult -match "PONG") {
        Write-Host "[OK] Redis is online" -ForegroundColor Green
        $redisOnline = $true
    } else {
        Write-Host "[OFFLINE] Redis is not accessible" -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] redis-cli not found, cannot check Redis" -ForegroundColor Gray
}

Write-Host "-------------------------------------------" -ForegroundColor Gray

if (-not $postgresOnline -or -not $redisOnline) {
    Write-Host ""
    Write-Host "[WARN] One or more database services are offline!" -ForegroundColor Red

    if (-not $SkipInstall) {
        Write-Host ""
        $installChoice = Read-Host "Do you want to install database now? (Y/n)"
        if ([string]::IsNullOrWhiteSpace($installChoice) -or $installChoice -match '^[Yy]$') {
            if (Test-Path $installScript) {
                Write-Host ""
                Write-Host "Starting database installation..." -ForegroundColor Cyan
                & $installScript
            } else {
                Write-Host "Error: InstallDB.ps1 not found at $installScript" -ForegroundColor Red
                Write-Host "Please install PostgreSQL and Redis manually, then run this script again." -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host ""
            Write-Host "Please ensure PostgreSQL and Redis are running before continuing." -ForegroundColor Yellow
            Write-Host "You can run InstallDB.ps1 later to set up the database." -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host ""
        Write-Host "Skipping installation check (--SkipInstall specified)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Verifying database connection..." -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Gray

$verifyFailed = $false

if ($postgresOnline) {
    $pgResult = pg_isready -h $dbHost -p $dbPort -U $dbUser -d $dbName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] PostgreSQL connection verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] PostgreSQL connection failed" -ForegroundColor Red
        $verifyFailed = $true
    }
}

if ($redisOnline) {
    if ([string]::IsNullOrWhiteSpace($redisPassword)) {
        $redisResult = redis-cli -h $redisHost -p $redisPort ping 2>$null
    } else {
        $redisResult = redis-cli -h $redisHost -p $redisPort -a $redisPassword ping 2>$null
    }
    if ($redisResult -match "PONG") {
        Write-Host "[OK] Redis connection verified" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Redis connection failed" -ForegroundColor Red
        $verifyFailed = $true
    }
}

Write-Host "-------------------------------------------" -ForegroundColor Gray

if ($verifyFailed) {
    Write-Host ""
    Write-Host "[WARN] Database connection verification failed!" -ForegroundColor Red
    Write-Host "Please check your configuration and ensure:" -ForegroundColor Yellow
    Write-Host "  1. Username and password are correct"
    Write-Host "  2. Database exists"
    Write-Host ""

    $retry = Read-Host "Do you want to reconfigure? (y/N)"
    if ($retry -match '^[Yy]$') {
        Write-Host ""
        Write-Host "Restarting configuration..." -ForegroundColor Cyan
        & "$scriptDir\initDatabase.ps1"
        exit 0
    }
} else {
    Write-Host "[OK] All database connections verified successfully!" -ForegroundColor Green
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
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "-----------" -ForegroundColor Yellow
Write-Host "Option 1 - Full stack (with app):" -ForegroundColor White
Write-Host "  cd $composeDir" -ForegroundColor Gray
Write-Host "  docker compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2 - Database only:" -ForegroundColor White
Write-Host "  cd $composeDir" -ForegroundColor Gray
Write-Host "  docker compose -f docker-compose-only-db.yaml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3 - Custom:" -ForegroundColor White
Write-Host "  docker compose -f docker-compose-only-db.yaml up -d postgres redis" -ForegroundColor Gray