param(
    [switch]$SkipPrompts
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$composeDir = Join-Path $projectRoot 'container\docker'
$envFile = Join-Path $projectRoot '.env'
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

$dbHost = Prompt-Value "PostgreSQL host" (Get-EnvValue 'DB_HOST' '127.0.0.1')
$dbPort = Prompt-Value "PostgreSQL host port" (Get-EnvValue 'DB_PORT' '5432')
$dbUser = Prompt-Value "PostgreSQL user" (Get-EnvValue 'DB_USER' 'asagity')
$dbPassword = Prompt-Value "PostgreSQL password" (Get-EnvValue 'DB_PASSWORD' 'example_password')
$dbName = Prompt-Value "PostgreSQL database name" (Get-EnvValue 'DB_NAME' 'asagity_db')
$redisHost = Prompt-Value "Redis host" (Get-EnvValue 'REDIS_HOST' '127.0.0.1')
$redisPort = Prompt-Value "Redis host port" (Get-EnvValue 'REDIS_PORT' '6379')
$redisPassword = Prompt-Value "Redis password (empty allowed)" (Get-EnvValue 'REDIS_PASSWORD' '')
$redisDb = Prompt-Value "Redis database index" (Get-EnvValue 'REDIS_DB' '0')
$serverPort = Prompt-Value "Asagity API server port" (Get-EnvValue 'SERVER_PORT' '2048')
$webPort = Prompt-Value "Asagity Web frontend port" (Get-EnvValue 'WEB_PORT' '2000')
$tz = Prompt-Value "Timezone" (Get-EnvValue 'TZ' 'Asia/Shanghai')
$jwtSecret = Get-EnvValue 'JWT_SECRET' 'asagity_secret_miku_39'

Write-Host ""
Write-Host "Advanced options (press Enter to use default):" -ForegroundColor Gray
Write-Host "-------------------------------------------" -ForegroundColor Gray
$driveStoragePath = Prompt-Value "Drive storage path" (Get-EnvValue 'DRIVE_STORAGE_PATH' '/app/storage/drive')
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

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "PostgreSQL: $dbHost`:$dbPort ($dbName)" -ForegroundColor Cyan
Write-Host "Redis:      $redisHost`:$redisPort" -ForegroundColor Cyan
Write-Host "API Server: $serverPort" -ForegroundColor Cyan
Write-Host "Web Front: $webPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration written to $envFile" -ForegroundColor Green
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