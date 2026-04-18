#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
COMPOSE_DIR="${PROJECT_ROOT}/container/docker"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

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

write_env() {
  local tz="$1"
  local server_port="$2"
  local web_port="$3"
  local db_host="$4"
  local db_port="$5"
  local db_user="$6"
  local db_password="$7"
  local db_name="$8"
  local redis_host="$9"
  local redis_port="${10}"
  local redis_password="${11}"
  local redis_db="${12}"
  local jwt_secret="${13}"
  local drive_storage_path="${14}"

  cat > "${ENV_FILE}" <<EOF
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
EOF
}

show_banner() {
  echo -e "${CYAN}===============================================${NC}"
  echo -e "${CYAN}  Asagity Database Manager${NC}"
  echo -e "${CYAN}===============================================${NC}"
  echo
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

echo_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
echo_fail() { echo -e "${RED}[FAIL]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_info() { echo -e "${CYAN}[INFO]${NC} $1"; }

# ==============================================
# Function 1: Create Database
# ==============================================
create_database() {
  echo -e "${CYAN}===============================================${NC}"
  echo -e "${CYAN}  [Function 1] Create Database${NC}"
  echo -e "${CYAN}===============================================${NC}"
  echo

  db_host="127.0.0.1"
  db_port="5432"
  db_user="asagity"
  db_password="example_password"
  db_name="asagity_db"
  redis_host="127.0.0.1"
  redis_port="6379"
  redis_password=""
  redis_db="0"
  server_port="2048"
  web_port="2000"
  tz="Asia/Shanghai"
  jwt_secret="asagity_secret_miku_39"
  drive_storage_path="/app/storage/drive"

  echo "Default configuration:"
  echo "  PostgreSQL: ${db_host}:${db_port} (${db_user}/${db_name})"
  echo "  Redis:      ${redis_host}:${redis_port}"
  echo "  API Server: ${server_port}"
  echo "  Web Front:  ${web_port}"
  echo

  read -r -p "Use default configuration? (Y/n): " use_default
  if [[ "${use_default}" == "n" ]] || [[ "${use_default}" == "N" ]]; then
    echo
    echo "Enter custom configuration:"
    db_host=$(prompt_value "PostgreSQL host" "${db_host}")
    db_port=$(prompt_value "PostgreSQL port" "${db_port}")
    db_user=$(prompt_value "PostgreSQL user" "${db_user}")
    db_password=$(prompt_value "PostgreSQL password" "${db_password}")
    db_name=$(prompt_value "PostgreSQL database" "${db_name}")
    redis_host=$(prompt_value "Redis host" "${redis_host}")
    redis_port=$(prompt_value "Redis port" "${redis_port}")
    redis_password=$(prompt_value "Redis password (empty = none)" "${redis_password}")
    redis_db=$(prompt_value "Redis database index" "${redis_db}")
    server_port=$(prompt_value "API server port" "${server_port}")
    web_port=$(prompt_value "Web frontend port" "${web_port}")
    tz=$(prompt_value "Timezone" "${tz}")
    drive_storage_path=$(prompt_value "Storage path" "${drive_storage_path}")
  fi

  write_env "${tz}" "${server_port}" "${web_port}" \
            "${db_host}" "${db_port}" "${db_user}" "${db_password}" "${db_name}" \
            "${redis_host}" "${redis_port}" "${redis_password}" "${redis_db}" \
            "${jwt_secret}" "${drive_storage_path}"

  echo
  echo_ok "Configuration written to ${ENV_FILE}"
  echo

  cd "${COMPOSE_DIR}"

  if [[ -f "docker-compose-only-db.yaml" ]]; then
    echo_info "Starting PostgreSQL and Redis containers..."
    docker compose -f docker-compose-only-db.yaml up -d
  elif [[ -f "docker-compose.yaml" ]]; then
    echo_info "Starting with full stack..."
    docker compose up -d postgres redis
  fi

  echo_info "Waiting for database to be ready..."
  sleep 5

  echo
  echo_ok "Database created successfully!"
}

# ==============================================
# Function 2: Verify Database
# ==============================================
verify_database() {
  echo -e "${CYAN}===============================================${NC}"
  echo -e "${CYAN}  [Function 2] Verify Database${NC}"
  echo -e "${CYAN}===============================================${NC}"
  echo

  db_host=$(read_env_value DB_HOST "127.0.0.1")
  db_port=$(read_env_value DB_PORT "5432")
  db_user=$(read_env_value DB_USER "asagity")
  db_password=$(read_env_value DB_PASSWORD "example_password")
  db_name=$(read_env_value DB_NAME "asagity_db")
  redis_host=$(read_env_value REDIS_HOST "127.0.0.1")
  redis_port=$(read_env_value REDIS_PORT "6379")
  redis_password=$(read_env_value REDIS_PASSWORD "")

  postgres_ok=false
  redis_ok=false

  echo_info "Detecting container status..."
  echo "-------------------------------------------"

  if command -v docker &> /dev/null; then
    pg_container=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E 'postgres|asagity.*postgres' | head -1)
    rd_container=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E 'redis|asagity.*redis' | head -1)

    if [[ -n "${pg_container}" ]]; then
      echo_info "Found PostgreSQL container: ${pg_container}"
      if docker exec "${pg_container}" pg_isready -U "${db_user}" -d "${db_name}" &> /dev/null; then
        postgres_ok=true
      fi
    fi

    if [[ -n "${rd_container}" ]]; then
      echo_info "Found Redis container: ${rd_container}"
      if [[ -n "${redis_password}" ]]; then
        if docker exec "${rd_container}" redis-cli -a "${redis_password}" ping 2>/dev/null | grep -q PONG; then
          redis_ok=true
        fi
      else
        if docker exec "${rd_container}" redis-cli ping 2>/dev/null | grep -q PONG; then
          redis_ok=true
        fi
      fi
    fi
  fi

  if [[ "${postgres_ok}" == "false" ]]; then
    if command -v pg_isready &> /dev/null; then
      if pg_isready -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" &> /dev/null; then
        echo_ok "PostgreSQL connection successful"
        postgres_ok=true
      else
        echo_fail "PostgreSQL connection failed"
      fi
    else
      echo_info "pg_isready not available"
    fi
  fi

  if [[ "${redis_ok}" == "false" ]]; then
    if command -v redis-cli &> /dev/null; then
      if [[ -n "${redis_password}" ]]; then
        if redis-cli -h "${redis_host}" -p "${redis_port}" -a "${redis_password}" ping 2>/dev/null | grep -q PONG; then
          echo_ok "Redis connection successful"
          redis_ok=true
        else
          echo_fail "Redis authentication failed"
        fi
      else
        if redis-cli -h "${redis_host}" -p "${redis_port}" ping 2>/dev/null | grep -q PONG; then
          echo_ok "Redis connection successful"
          redis_ok=true
        else
          echo_fail "Redis connection failed"
        fi
      fi
    else
      echo_info "redis-cli not available"
    fi
  fi

  echo "-------------------------------------------"

  if [[ "${postgres_ok}" == "true" ]] && [[ "${redis_ok}" == "true" ]]; then
    echo
    echo_ok "All database services verified!"
    echo
    echo -e "${GREEN}===============================================${NC}"
    echo -e "${GREEN}  Ready to start Asagity!${NC}"
    echo -e "${GREEN}===============================================${NC}"
    echo
    echo "Run: cd ${PROJECT_ROOT}/core && go run ."
    return 0
  else
    echo
    echo_warn "Some database services failed verification"
    echo
    read -r -p "Run Create Database function? (Y/n): " create_choice
    if [[ -z "${create_choice}" ]] || [[ "${create_choice}" == "Y" ]] || [[ "${create_choice}" == "y" ]]; then
      create_database
    else
      return 1
    fi
  fi
}

# ==============================================
# Main Menu
# ==============================================
show_banner

echo "Select function:"
echo "  1) Create Database    - Setup PostgreSQL + Redis containers"
echo "  2) Verify Database    - Test connection and verify services"
echo "  3) Both              - Create then verify"
echo "  4) Exit"
echo

read -r -p "Enter choice [1-4]: " choice

RESULT=0

case "${choice}" in
  1)
    create_database
    RESULT=$?
    ;;
  2)
    verify_database
    RESULT=$?
    ;;
  3)
    create_database
    echo
    verify_database
    RESULT=$?
    ;;
  *)
    echo "Exiting..."
    ;;
esac

if [[ $RESULT -eq 0 ]]; then
  RESULT_FILE="${PROJECT_ROOT}/.initdb_result"
  echo "ASAGITY_DB_READY=true" > "${RESULT_FILE}"
  echo "ASAGITY_DB_HOST=${db_host}" >> "${RESULT_FILE}"
  echo "ASAGITY_DB_PORT=${db_port}" >> "${RESULT_FILE}"
else
  RESULT_FILE="${PROJECT_ROOT}/.initdb_result"
  echo "ASAGITY_DB_READY=false" > "${RESULT_FILE}"
fi

exit $RESULT