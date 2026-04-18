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

detect_postgres_port() {
  local default_port="5432"
  
  if command -v ss &> /dev/null; then
    local pg_port=$(ss -tlnp 2>/dev/null | grep -E ':(5432|5433)\s' | head -1 | awk -F: '{print $NF}' | awk '{print $1}')
    [[ -n "${pg_port}" ]] && echo "${pg_port}" && return
  fi
  
  if command -v netstat &> /dev/null; then
    local pg_port=$(netstat -tlnp 2>/dev/null | grep -E ':(5432|5433)\s' | head -1 | awk -F: '{print $NF}' | awk '{print $1}')
    [[ -n "${pg_port}" ]] && echo "${pg_port}" && return
  fi
  
  echo "${default_port}"
}

detect_redis_port() {
  local default_port="6379"
  
  if command -v ss &> /dev/null; then
    local rd_port=$(ss -tlnp 2>/dev/null | grep -E ':(6379|6380)\s' | head -1 | awk -F: '{print $NF}' | awk '{print $1}')
    [[ -n "${rd_port}" ]] && echo "${rd_port}" && return
  fi
  
  if command -v netstat &> /dev/null; then
    local rd_port=$(netstat -tlnp 2>/dev/null | grep -E ':(6379|6380)\s' | head -1 | awk -F: '{print $NF}' | awk '{print $1}')
    [[ -n "${rd_port}" ]] && echo "${rd_port}" && return
  fi
  
  echo "${default_port}"
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

echo "Phase 1: Port Detection"
echo "-------------------------------------------"
detected_pg_port=$(detect_postgres_port)
detected_rd_port=$(detect_redis_port)
echo "Detected PostgreSQL port: ${detected_pg_port}"
echo "Detected Redis port:      ${detected_rd_port}"

port_mismatch=false
if [[ "${detected_pg_port}" != "${db_port}" ]]; then
  echo "[WARN] .env DB_PORT (${db_port}) differs from detected (${detected_pg_port})"
  port_mismatch=true
fi
if [[ "${detected_rd_port}" != "${redis_port}" ]]; then
  echo "[WARN] .env REDIS_PORT (${redis_port}) differs from detected (${detected_rd_port})"
  port_mismatch=true
fi
echo "-------------------------------------------"

if [[ "${port_mismatch}" == "true" ]]; then
  echo
  read -r -p "Ports mismatch detected. Reconfigure? (Y/n): " reconfig_choice
  if [[ -z "${reconfig_choice}" ]] || [[ "${reconfig_choice}" == "Y" ]] || [[ "${reconfig_choice}" == "y" ]]; then
    db_port="${detected_pg_port}"
    redis_port="${detected_rd_port}"
    echo "Using detected ports."
  fi
fi

echo
echo "Phase 2: Connection Testing"
echo "-------------------------------------------"

postgres_online=false
redis_online=false

if command -v pg_isready &> /dev/null; then
  if pg_isready -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" &> /dev/null; then
    echo "[OK] PostgreSQL connection successful"
    postgres_online=true
  else
    echo "[FAIL] PostgreSQL connection failed"
    echo "  This may indicate: wrong user, password, or database name"
  fi
else
  echo "[SKIP] pg_isready not found"
fi

if command -v redis-cli &> /dev/null; then
  if [[ -n "${redis_password}" ]]; then
    if redis-cli -h "${redis_host}" -p "${redis_port}" -a "${redis_password}" ping 2>/dev/null | grep -q PONG; then
      echo "[OK] Redis connection successful"
      redis_online=true
    else
      echo "[FAIL] Redis authentication failed"
    fi
  else
    if redis-cli -h "${redis_host}" -p "${redis_port}" ping 2>/dev/null | grep -q PONG; then
      echo "[OK] Redis connection successful (no password)"
      redis_online=true
    else
      echo "[FAIL] Redis connection failed"
    fi
  fi
else
  echo "[SKIP] redis-cli not found"
fi
echo "-------------------------------------------"

if [[ "${postgres_online}" == "false" ]] || [[ "${redis_online}" == "false" ]]; then
  echo
  echo "Phase 3: Database Installation"
  echo "[WARN] One or more database services are offline!"
  echo
  
  read -r -p "Install database now? (Y/n): " install_choice
  if [[ -z "${install_choice}" ]] || [[ "${install_choice}" == "Y" ]] || [[ "${install_choice}" == "y" ]]; then
    if [[ -f "${INSTALL_SCRIPT}" ]]; then
      echo "Starting database installation..."
      bash "${INSTALL_SCRIPT}"
    else
      echo "Error: InstallDB.sh not found"
      exit 1
    fi
  else
    echo "Please ensure PostgreSQL and Redis are running manually."
    exit 0
  fi
fi

echo
echo "Phase 4: Configuration Update"
echo "-------------------------------------------"
echo "Current .env:"
echo "  PostgreSQL: ${db_host}:${db_port} (${db_user}/${db_name})"
echo "  Redis:      ${redis_host}:${redis_port}"
echo "  API Server: ${server_port}"
echo "  Web Front:  ${web_port}"
echo

read -r -p "Update configuration? (Y/n): " update_choice
if [[ "${update_choice}" == "n" ]] || [[ "${update_choice}" == "N" ]]; then
  echo "Keeping existing configuration."
else
  echo "Enter new values (press Enter to keep current):"
  echo
  
  db_host=$(prompt_value "PostgreSQL host" "${db_host}")
  db_port=$(prompt_value "PostgreSQL port" "${db_port}")
  db_user=$(prompt_value "PostgreSQL user" "${db_user}")
  db_password=$(prompt_value "PostgreSQL password" "${db_password}")
  db_name=$(prompt_value "PostgreSQL database" "${db_name}")
  redis_host=$(prompt_value "Redis host" "127.0.0.1")
  redis_port=$(prompt_value "Redis port" "${redis_port}")
  redis_password=$(prompt_value "Redis password (empty = none)" "${redis_password}")
  redis_db=$(prompt_value "Redis database index" "0")
  server_port=$(prompt_value "API server port" "${server_port}")
  web_port=$(prompt_value "Web frontend port" "${web_port}")
  tz=$(prompt_value "Timezone" "${tz}")
  drive_storage_path=$(prompt_value "Storage path" "${drive_storage_path}")
  echo

  BACKUP_SUFFIX=$(date +%Y%m%d%H%M%S)
  [[ -f "${ENV_FILE}" ]] && cp "${ENV_FILE}" "${ENV_FILE}.${BACKUP_SUFFIX}.bak"

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
echo "==============================================="
echo "  Configuration Complete!"
echo "==============================================="
echo
echo "PostgreSQL: ${db_host}:${db_port} (${db_name})"
echo "Redis:      ${redis_host}:${redis_port}"
echo "API Server: ${server_port}"
echo "Web Front:  ${web_port}"
echo
echo "Next: cd ${PROJECT_ROOT}/core && go run ."