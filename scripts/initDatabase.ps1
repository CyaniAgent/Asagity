param()

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
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

$dbHost = Prompt-Value 'PostgreSQL host' (Get-EnvValue 'DB_HOST' '127.0.0.1')
$dbPort = Prompt-Value 'PostgreSQL host port' (Get-EnvValue 'DB_PORT' '5432')
$dbUser = Prompt-Value 'PostgreSQL user' (Get-EnvValue 'DB_USER' 'asagity')
$dbPassword = Prompt-Value 'PostgreSQL password' (Get-EnvValue 'DB_PASSWORD' 'example_password')
$dbName = Prompt-Value 'PostgreSQL database name' (Get-EnvValue 'DB_NAME' 'asagity_db')
$redisHost = Prompt-Value 'Redis host' '127.0.0.1'
$redisPort = Prompt-Value 'Redis host port' (Get-EnvValue 'REDIS_PORT' '6379')
$redisPassword = Prompt-Value 'Redis password (empty allowed)' (Get-EnvValue 'REDIS_PASSWORD' '')
$redisDb = Prompt-Value 'Redis database index' (Get-EnvValue 'REDIS_DB' '0')
$serverPort = Prompt-Value 'Asagity API port' (Get-EnvValue 'SERVER_PORT' '2048')
$jwtSecret = Get-EnvValue 'JWT_SECRET' 'asagity_secret_miku_39'

if (Test-Path $envFile) {
    Copy-Item $envFile "$envFile.$backupSuffix.bak"
}

$content = @(
    "SERVER_PORT=$serverPort"
    ""
    "DB_HOST=$dbHost"
    "DB_PORT=$dbPort"
    "DB_USER=$dbUser"
    "DB_PASSWORD=$dbPassword"
    "DB_NAME=$dbName"
    ""
    "REDIS_ADDR=$redisHost`:$redisPort"
    "REDIS_PASSWORD=$redisPassword"
    "REDIS_DB=$redisDb"
    ""
    "POSTGRES_PORT=$dbPort"
    "POSTGRES_USER=$dbUser"
    "POSTGRES_PASSWORD=$dbPassword"
    "POSTGRES_DB=$dbName"
    "REDIS_PORT=$redisPort"
    ""
    "JWT_SECRET=$jwtSecret"
)

Set-Content -Path $envFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Database configuration written to $envFile"
Write-Host "PostgreSQL will map to host port $dbPort, Redis to host port $redisPort."
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Start dependencies: docker compose up -d postgres redis"
Write-Host "2. Start backend: cd core; go run ."
