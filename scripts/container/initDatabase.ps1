param(
    [ValidateSet('1', '2', '3', '4')]
    [string]$Choice = ''
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$composeDir = Join-Path $projectRoot 'container\docker'
$envFile = Join-Path $projectRoot '.env'

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

function Write-Env {
    param(
        [string]$Tz, [string]$ServerPort, [string]$WebPort,
        [string]$DbHost, [string]$DbPort, [string]$DbUser, [string]$DbPassword, [string]$DbName,
        [string]$RedisHost, [string]$RedisPort, [string]$RedisPassword, [string]$RedisDb,
        [string]$JwtSecret, [string]$DriveStoragePath
    )

    $content = @(
        "# Asagity Configuration",
        "TZ=$Tz",
        "",
        "# Server Ports",
        "SERVER_PORT=$ServerPort",
        "WEB_PORT=$WebPort",
        "",
        "# PostgreSQL",
        "DB_HOST=$DbHost",
        "DB_PORT=$DbPort",
        "DB_USER=$DbUser",
        "DB_PASSWORD=$DbPassword",
        "DB_NAME=$DbName",
        "",
        "POSTGRES_PORT=$DbPort",
        "POSTGRES_USER=$DbUser",
        "POSTGRES_PASSWORD=$DbPassword",
        "POSTGRES_DB=$DbName",
        "",
        "# Redis",
        "REDIS_HOST=$RedisHost",
        "REDIS_ADDR=$RedisHost`:$RedisPort",
        "REDIS_PASSWORD=$RedisPassword",
        "REDIS_DB=$RedisDb",
        "REDIS_PORT=$RedisPort",
        "",
        "# Security",
        "JWT_SECRET=$JwtSecret",
        "",
        "# Storage",
        "DRIVE_STORAGE_PATH=$DriveStoragePath"
    )
    Set-Content -Path $envFile -Value $content -Encoding UTF8
}

function Prompt-Value {
    param([string]$Label, [string]$Current)
    $value = Read-Host "$Label [$Current]"
    if ([string]::IsNullOrWhiteSpace($value)) { return $Current }
    return $value
}

function Show-Banner {
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  Asagity Database Manager" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
}

# ==============================================
# Function 1: Create Database
# ==============================================
function Create-Database {
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  [Function 1] Create Database" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""

    $dbHost = '127.0.0.1'
    $dbPort = '5432'
    $dbUser = 'asagity'
    $dbPassword = 'example_password'
    $dbName = 'asagity_db'
    $redisHost = '127.0.0.1'
    $redisPort = '6379'
    $redisPassword = ''
    $redisDb = '0'
    $serverPort = '2048'
    $webPort = '2000'
    $tz = 'Asia/Shanghai'
    $jwtSecret = 'asagity_secret_miku_39'
    $driveStoragePath = '/app/storage/drive'

    Write-Host "Default configuration:" -ForegroundColor Yellow
    Write-Host "  PostgreSQL: $dbHost`:$dbPort ($dbUser/$dbName)" -ForegroundColor White
    Write-Host "  Redis:      $redisHost`:$redisPort" -ForegroundColor White
    Write-Host "  API Server: $serverPort" -ForegroundColor White
    Write-Host "  Web Front:  $webPort" -ForegroundColor White
    Write-Host ""

    $useDefault = Read-Host "Use default configuration? (Y/n)"
    if ($useDefault -ne 'n' -and $useDefault -ne 'N') {
        Write-Host "Using default configuration..." -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "Enter custom configuration:" -ForegroundColor Cyan

        $dbHost = Prompt-Value "PostgreSQL host" $dbHost
        $dbPort = Prompt-Value "PostgreSQL port" $dbPort
        $dbUser = Prompt-Value "PostgreSQL user" $dbUser
        $dbPassword = Prompt-Value "PostgreSQL password" $dbPassword
        $dbName = Prompt-Value "PostgreSQL database" $dbName
        $redisHost = Prompt-Value "Redis host" $redisHost
        $redisPort = Prompt-Value "Redis port" $redisPort
        $redisPassword = Prompt-Value "Redis password (empty = none)" $redisPassword
        $redisDb = Prompt-Value "Redis database index" $redisDb
        $serverPort = Prompt-Value "API server port" $serverPort
        $webPort = Prompt-Value "Web frontend port" $webPort
        $tz = Prompt-Value "Timezone" $tz
        $driveStoragePath = Prompt-Value "Storage path" $driveStoragePath
    }

    Write-Env $tz $serverPort $webPort $dbHost $dbPort $dbUser $dbPassword $dbName $redisHost $redisPort $redisPassword $redisDb $jwtSecret $driveStoragePath

    Write-Host ""
    Write-Host "[OK] Configuration written to $envFile" -ForegroundColor Green
    Write-Host ""

    Set-Location $composeDir

    if (Test-Path "docker-compose-only-db.yaml") {
        Write-Host "Starting PostgreSQL and Redis containers..." -ForegroundColor Yellow
        docker compose -f docker-compose-only-db.yaml up -d
    } elseif (Test-Path "docker-compose.yaml") {
        Write-Host "Starting with full stack..." -ForegroundColor Yellow
        docker compose up -d postgres redis
    }

    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    Write-Host ""
    Write-Host "[OK] Database created successfully!" -ForegroundColor Green
}

# ==============================================
# Function 2: Verify Database
# ==============================================
function Verify-Database {
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  [Function 2] Verify Database" -ForegroundColor Cyan
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

    $postgresOk = $false
    $redisOk = $false

    Write-Host "Detecting container status..." -ForegroundColor Yellow
    Write-Host "-------------------------------------------" -ForegroundColor Gray

    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $pgContainer = docker ps --format '{{.Names}}' | Where-Object { $_ -match 'postgres|asagity.*postgres' } | Select-Object -First 1
        $rdContainer = docker ps --format '{{.Names}}' | Where-Object { $_ -match 'redis|asagity.*redis' } | Select-Object -First 1

        if ($pgContainer) {
            Write-Host "Found PostgreSQL container: $pgContainer" -ForegroundColor Cyan
            if (docker exec $pgContainer pg_isready -U $dbUser -d $dbName 2>$null) {
                $postgresOk = $true
            }
        }

        if ($rdContainer) {
            Write-Host "Found Redis container: $rdContainer" -ForegroundColor Cyan
            if ([string]::IsNullOrWhiteSpace($redisPassword)) {
                if (docker exec $rdContainer redis-cli ping 2>$null -match "PONG") {
                    $redisOk = $true
                }
            } else {
                if (docker exec $rdContainer redis-cli -a $redisPassword ping 2>$null -match "PONG") {
                    $redisOk = $true
                }
            }
        }
    }

    if (-not $postgresOk) {
        if (Get-Command pg_isready -ErrorAction SilentlyContinue) {
            $pgResult = pg_isready -h $dbHost -p $dbPort -U $dbUser -d $dbName 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] PostgreSQL connection successful" -ForegroundColor Green
                $postgresOk = $true
            } else {
                Write-Host "[FAIL] PostgreSQL connection failed" -ForegroundColor Red
            }
        } else {
            Write-Host "[SKIP] pg_isready not available" -ForegroundColor Gray
        }
    }

    if (-not $redisOk) {
        if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
            if ([string]::IsNullOrWhiteSpace($redisPassword)) {
                $redisResult = redis-cli -h $redisHost -p $redisPort ping 2>$null
            } else {
                $redisResult = redis-cli -h $redisHost -p $redisPort -a $redisPassword ping 2>$null
            }
            if ($redisResult -match "PONG") {
                Write-Host "[OK] Redis connection successful" -ForegroundColor Green
                $redisOk = $true
            } else {
                Write-Host "[FAIL] Redis connection failed" -ForegroundColor Red
            }
        } else {
            Write-Host "[SKIP] redis-cli not available" -ForegroundColor Gray
        }
    }

    Write-Host "-------------------------------------------" -ForegroundColor Gray

    if ($postgresOk -and $redisOk) {
        Write-Host ""
        Write-Host "[OK] All database services verified!" -ForegroundColor Green
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "  Ready to start Asagity!" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Run: cd $projectRoot\core; go run ." -ForegroundColor Yellow
        return $true
    } else {
        Write-Host ""
        Write-Host "[WARN] Some database services failed verification" -ForegroundColor Yellow
        Write-Host ""

        $createChoice = Read-Host "Run Create Database function? (Y/n)"
        if ($createChoice -ne 'n' -and $createChoice -ne 'N') {
            Create-Database
        } else {
            return $false
        }
    }
}

# ==============================================
# Main Menu
# ==============================================
Show-Banner

Write-Host "Select function:" -ForegroundColor Yellow
Write-Host "  1) Create Database    - Setup PostgreSQL + Redis containers" -ForegroundColor White
Write-Host "  2) Verify Database    - Test connection and verify services" -ForegroundColor White
Write-Host "  3) Both              - Create then verify" -ForegroundColor White
Write-Host "  4) Exit" -ForegroundColor White
Write-Host ""

if ([string]::IsNullOrWhiteSpace($Choice)) {
    $Choice = Read-Host "Enter choice [1-4]"
}

$script:Result = 0

switch ($Choice) {
    '1' { Create-Database; $script:Result = $? }
    '2' { $result = Verify-Database; $script:Result = $(if ($result) { 0 } else { 1 }) }
    '3' { Create-Database; Write-Host ""; $result = Verify-Database; $script:Result = $(if ($result) { 0 } else { 1 }) }
    default { Write-Host "Exiting..." -ForegroundColor Gray }
}

if ($script:Result -eq 0) {
    Write-Host "ASAGITY_DB_READY=true" -ForegroundColor Green
    Write-Host "ASAGITY_DB_HOST=$dbHost" -ForegroundColor Green
    Write-Host "ASAGITY_DB_PORT=$dbPort" -ForegroundColor Green
    exit 0
} else {
    Write-Host "ASAGITY_DB_READY=false" -ForegroundColor Red
    exit 1
}