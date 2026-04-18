param(
    [ValidateSet('docker', 'podman', 'native')]
    [string]$Method = ''
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$envFile = Join-Path $projectRoot '.env'
$composeDir = Join-Path $projectRoot 'container\docker'
$podmanDir = Join-Path $projectRoot 'container\podman'

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

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Asagity Database Installer" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $envFile)) {
    Write-Host "Configuration file not found!" -ForegroundColor Red
    Write-Host "Running initDatabase first..." -ForegroundColor Yellow
    Write-Host ""

    $initScript = Join-Path $scriptDir "container\initDatabase.ps1"
    if (Test-Path $initScript) {
        & $initScript
    } else {
        Write-Host "Error: initDatabase.ps1 not found!" -ForegroundColor Red
        exit 1
    }
}

if ([string]::IsNullOrWhiteSpace($Method)) {
    Write-Host "Select installation method:" -ForegroundColor Yellow
    Write-Host "  1) Docker (recommended)" -ForegroundColor White
    Write-Host "  2) Podman" -ForegroundColor White
    Write-Host "  3) Native (local host)" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "Enter choice [1]"
    switch ($choice) {
        '1' { $Method = 'docker' }
        '2' { $Method = 'podman' }
        '3' { $Method = 'native' }
        default { $Method = 'docker' }
    }
}

Write-Host ""
Write-Host "Installation method: $Method" -ForegroundColor Cyan
Write-Host ""

$dbHost = Get-EnvValue 'DB_HOST' '127.0.0.1'
$dbPort = Get-EnvValue 'DB_PORT' '5432'
$dbUser = Get-EnvValue 'DB_USER' 'asagity'
$dbPassword = Get-EnvValue 'DB_PASSWORD' 'example_password'
$dbName = Get-EnvValue 'DB_NAME' 'asagity_db'
$redisPort = Get-EnvValue 'REDIS_PORT' '6379'
$redisPassword = Get-EnvValue 'REDIS_PASSWORD' ''

function Install-Docker {
    Write-Host "Installing PostgreSQL + Redis via Docker..." -ForegroundColor Yellow

    Set-Location $composeDir

    if (Test-Command 'docker') {
        docker compose -f docker-compose-only-db.yaml up -d
        Write-Host ""
        Write-Host "Docker containers started!" -ForegroundColor Green
    } else {
        Write-Host "Error: Docker is not installed!" -ForegroundColor Red
        exit 1
    }
}

function Install-Podman {
    Write-Host "Installing PostgreSQL + Redis via Podman..." -ForegroundColor Yellow

    Set-Location $podmanDir

    if (Test-Command 'podman') {
        if (Test-Command 'podman-compose') {
            podman-compose -f podman-compose-only-db.yaml up -d
        } else {
            Write-Host "Note: podman-compose not found, using native podman commands..." -ForegroundColor Yellow

            podman run -d --name asagity_postgres `
                -e POSTGRES_USER="$dbUser" `
                -e POSTGRES_PASSWORD="$dbPassword" `
                -e POSTGRES_DB="$dbName" `
                -p "${dbPort}:5432" `
                -v asagity_postgres_data:/var/lib/postgresql/data `
                postgres:18.3-alpine3.23

            $redisCmd = "redis-server --requirepass $redisPassword --appendonly yes"
            podman run -d --name asagity_redis `
                -e REDIS_PASSWORD="$redisPassword" `
                -p "${redisPort}:6379" `
                -v asagity_redis_data:/data `
                redis:8.6.2-alpine $redisCmd
        }
        Write-Host ""
        Write-Host "Podman containers started!" -ForegroundColor Green
    } else {
        Write-Host "Error: Podman is not installed!" -ForegroundColor Red
        exit 1
    }
}

function Install-Native {
    Write-Host "Installing PostgreSQL + Redis on local host..." -ForegroundColor Yellow
    Write-Host ""

    if (-not (Test-Command 'pg_isready')) {
        Write-Host "Please install PostgreSQL first:" -ForegroundColor Red
        Write-Host "  Windows: Download from https://www.postgresql.org/download/windows/"
        Write-Host "  Ubuntu:  sudo apt install postgresql postgresql-contrib"
        Write-Host "  macOS:   brew install postgresql"
        exit 1
    }

    if (-not (Test-Command 'redis-cli')) {
        Write-Host "Please install Redis first:" -ForegroundColor Red
        Write-Host "  Windows: Download from https://redis.io/download/"
        Write-Host "  Ubuntu:  sudo apt install redis-server"
        Write-Host "  macOS:   brew install redis"
        exit 1
    }

    Write-Host "PostgreSQL and Redis are installed." -ForegroundColor Green
    Write-Host ""
    Write-Host "Please start services manually and create database:" -ForegroundColor Yellow
    Write-Host "  psql -U postgres -c \"CREATE USER $dbUser WITH PASSWORD '$dbPassword';\"" -ForegroundColor Gray
    Write-Host "  psql -U postgres -c \"CREATE DATABASE $dbName OWNER $dbUser;\"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Local PostgreSQL and Redis are ready!" -ForegroundColor Green
}

switch ($Method) {
    'docker'  { Install-Docker }
    'podman'  { Install-Podman }
    'native'  { Install-Native }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Connection info:" -ForegroundColor Cyan
Write-Host "  PostgreSQL: $dbHost`:$dbPort ($dbName)" -ForegroundColor White
Write-Host "  Redis:      $dbHost`:$redisPort" -ForegroundColor White
Write-Host "  User:       $dbUser" -ForegroundColor White
Write-Host ""
Write-Host "Next step: cd $projectRoot\core; go run ." -ForegroundColor Yellow