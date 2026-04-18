#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
COMPOSE_DIR="${PROJECT_ROOT}/container/docker"
INSTALL_SCRIPT="${PROJECT_ROOT}/scripts/InstallDB.sh"

read_env_value() {
  local key="$1"
  local fallback="$2"

  if [[ -f "${ENV_FILE}" ]]; then
    local line
    line=$(grep -E "^${key}=" "${ENV_FILE}" 2>/dev/null | tail -n 1 || echo "")
    if [[ -n "${line}" ]]; then
      echo "${line#*=}"
      return
    fi
  fi

  echo "${fallback}"
}

prompt_value() {
  local label="$1"
  local current="$2"
  local value=""
  read -r -p "${label} [${current}]: " value
  if [[ -z "${value}" ]]; then
    value="${current}"
  fi
  echo "${value}"
}

echo "==============================================="
echo "  Asagity Database Configuration"
echo "==============================================="
echo

db_host=$(read_env_value DB_HOST "127.0.0.1")
db_port=$(read_env_value DB_PORT "5432")
db_user=$(read_env_value DB_USER "asagity")
db_password=$(read_env_value DB_PASSWORD "example_password")
db_name=$(read_env_value DB_NAME "asagity_db")
redis_host=$(read_env_value REDIS_HOST "127.0.0.1")
redis_port=$(read_env_value REDIS_PORT "6379")
redis_password=$(read_env_value REDIS_PASSWORD "")
server_port=$(read_env_value SERVER_PORT "2048")
web_port=$(read_env_value WEB_PORT "2000")
tz=$(read_env_value TZ "Asia/Shanghai")
jwt_secret=$(read_env_value JWT_SECRET "asagity_secret_miku_39")
drive_storage_path=$(read_env_value DRIVE_STORAGE_PATH "/app/storage/drive")

echo "Current .env configuration:"
echo "  PostgreSQL: ${db_host}:${db_port} (${db_name})"
echo "  Redis:      ${redis_host}:${redis_port}"
echo "  API Server: ${server_port}"
echo "  Web Front:  ${web_port}"
echo
read -r -p "Update configuration? (Y/n): " update_choice
if [[ "${update_choice}" == "n" ]] || [[ "${update_choice}" == "N" ]]; then
  echo "Keeping existing configuration."
else
  echo
  echo "Enter new configuration values:"
  echo
  
  db_host=$(prompt_value "PostgreSQL host" "${db_host}")
  db_port=$(prompt_value "PostgreSQL host port" "${db_port}")
  db_user=$(prompt_value "PostgreSQL user" "${db_user}")
  db_password=$(prompt_value "PostgreSQL password" "${db_password}")
  db_name=$(prompt_value "PostgreSQL database name" "${db_name}")
  redis_host=$(prompt_value "Redis host" "127.0.0.1")
  redis_port=$(prompt_value "Redis host port" "${redis_port}")
  redis_password=$(prompt_value "Redis password (empty allowed)" "${redis_password}")
  redis_db=$(prompt_value "Redis database index" "0")
  server_port=$(prompt_value "Asagity API server port" "${server_port}")
  web_port=$(prompt_value "Asagity Web frontend port" "${web_port}")
  tz=$(prompt_value "Timezone" "${tz}")
  
  echo
  echo "Advanced options (press Enter to use default):"
  echo "-------------------------------------------"
  drive_storage_path=$(prompt_value "Drive storage path" "${drive_storage_path}")
  echo "-------------------------------------------"
  echo

  BACKUP_SUFFIX=$(date +%Y%m%d%H%M%S)
  if [[ -f "${ENV_FILE}" ]]; then
    cp "${ENV_FILE}" "${ENV_FILE}.${BACKUP_SUFFIX}.bak"
    echo "Backed up existing .env to .env.${BACKUP_SUFFIX}.bak"
  fi

  cat > "${ENV_FILE}" <<ENVEOF
# Asagity Configuration
TZ=${tz}

# Server Ports
SERVER_PORT=${server_port}
WEB_PORT=${web_port}

# PostgreSQL
DB_HOST=${db_host}
DB_PORT=${db_port}
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}

POSTGRES_PORT=${db_port}
POSTGRES_USER=${db_user}
POSTGRES_PASSWORD=${db_password}
POSTGRES_DB=${db_name}

# Redis
REDIS_HOST=${redis_host}
REDIS_ADDR=${redis_host}:${redis_port}
REDIS_PASSWORD=${redis_password}
REDIS_DB=${redis_db}
REDIS_PORT=${redis_port}

# Security
JWT_SECRET=${jwt_secret}

# Storage
DRIVE_STORAGE_PATH=${drive_storage_path}
ENVEOF

  echo "Configuration written to ${ENV_FILE}"
fi

echo
echo "Checking database services status..."
echo "-------------------------------------------"

postgres_online=false
redis_online=false

if command -v pg_isready &> /dev/null; then
  if pg_isready -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" &> /dev/null; then
    echo "[OK] PostgreSQL is online"
    postgres_online=true
  else
    echo "[OFFLINE] PostgreSQL is not accessible"
  fi
else
  echo "[SKIP] pg_isready not found, cannot check PostgreSQL"
fi

if command -v redis-cli &> /dev/null; then
  if [[ -n "${redis_password}" ]]; then
    if redis-cli -h "${redis_host}" -p "${redis_port}" -a "${redis_password}" ping 2>/dev/null | grep -q PONG; then
      echo "[OK] Redis is online"
      redis_online=true
    else
      echo "[OFFLINE] Redis is not accessible"
    fi
  else
    if redis-cli -h "${redis_host}" -p "${redis_port}" ping 2>/dev/null | grep -q PONG; then
      echo "[OK] Redis is online"
      redis_online=true
    else
      echo "[OFFLINE] Redis is not accessible"
    fi
  fi
else
  echo "[SKIP] redis-cli not found, cannot check Redis"
fi

echo "-------------------------------------------"

if [[ "${postgres_online}" == "false" ]] || [[ "${redis_online}" == "false" ]]; then
  echo
  echo "[WARN] One or more database services are offline!"
  echo
  read -r -p "Do you want to install database now? (Y/n): " install_choice
  if [[ -z "${install_choice}" ]] || [[ "${install_choice}" == "Y" ]] || [[ "${install_choice}" == "y" ]]; then
    if [[ -f "${INSTALL_SCRIPT}" ]]; then
      echo
      echo "Starting database installation..."
      bash "${INSTALL_SCRIPT}"
    else
      echo "Error: InstallDB.sh not found at ${INSTALL_SCRIPT}"
      echo "Please install PostgreSQL and Redis manually, then run this script again."
      exit 1
    fi
  else
    echo
    echo "Please ensure PostgreSQL and Redis are running before continuing."
    echo "You can run InstallDB.sh later to set up the database."
    exit 0
  fi
fi

echo
echo "Verifying database connection..."
echo "-------------------------------------------"

verify_failed=0

if [[ "${postgres_online}" == "true" ]]; then
  if pg_isready -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" &> /dev/null; then
    echo "[OK] PostgreSQL connection verified"
  else
    echo "[FAIL] PostgreSQL connection failed"
    verify_failed=1
  fi
fi

if [[ "${redis_online}" == "true" ]]; then
  if [[ -n "${redis_password}" ]]; then
    if redis-cli -h "${redis_host}" -p "${redis_port}" -a "${redis_password}" ping 2>/dev/null | grep -q PONG; then
      echo "[OK] Redis connection verified"
    else
      echo "[FAIL] Redis connection failed"
      verify_failed=1
    fi
  else
    if redis-cli -h "${redis_host}" -p "${redis_port}" ping 2>/dev/null | grep -q PONG; then
      echo "[OK] Redis connection verified"
    else
      echo "[FAIL] Redis connection failed"
      verify_failed=1
    fi
  fi
fi

echo "-------------------------------------------"

if [[ ${verify_failed} -eq 1 ]]; then
  echo
  echo "[WARN] Database connection verification failed!"
  echo "Please check your configuration and ensure:"
  echo "  1. Username and password are correct"
  echo "  2. Database exists"
  echo
  read -r -p "Do you want to reconfigure? (y/N): " retry_choice
  if [[ "${retry_choice}" == "y" ]] || [[ "${retry_choice}" == "Y" ]]; then
    echo
    echo "Restarting configuration..."
    bash "${SCRIPT_DIR}/initDatabase.sh"
    exit 0
  fi
else
  echo "[OK] All database connections verified successfully!"
fi

echo
echo "==============================================="
echo "  Configuration Complete!"
echo "==============================================="
echo
echo "PostgreSQL: ${db_host}:${db_port} (${db_name})"
echo "Redis:      ${redis_host}:${redis_port}"
echo "API Server: ${server_port}"
echo "Web Front:  ${web_port}"
echo
echo "Next steps:"
echo "-----------"
echo "Option 1 - Full stack (with app):"
echo "  cd ${COMPOSE_DIR}"
echo "  docker compose up -d"
echo
echo "Option 2 - Database only:"
echo "  cd ${COMPOSE_DIR}"
echo "  docker compose -f docker-compose-only-db.yaml up -d"
echo
echo "Option 3 - Custom:"
echo "  docker compose -f docker-compose-only-db.yaml up -d postgres redis"