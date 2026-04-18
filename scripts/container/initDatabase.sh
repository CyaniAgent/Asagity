#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_DIR="${PROJECT_ROOT}/container/docker"
ENV_FILE="${PROJECT_ROOT}/.env"
BACKUP_SUFFIX="$(date +%Y%m%d%H%M%S)"

read_env_value() {
  local key="$1"
  local fallback="$2"

  if [[ -f "${ENV_FILE}" ]]; then
    local line
    line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
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

db_host="$(prompt_value "PostgreSQL host" "$(read_env_value DB_HOST 127.0.0.1)")"
db_port="$(prompt_value "PostgreSQL host port" "$(read_env_value DB_PORT 5432)")"
db_user="$(prompt_value "PostgreSQL user" "$(read_env_value DB_USER asagity)")"
db_password="$(prompt_value "PostgreSQL password" "$(read_env_value DB_PASSWORD example_password)")"
db_name="$(prompt_value "PostgreSQL database name" "$(read_env_value DB_NAME asagity_db)")"
redis_host="$(prompt_value "Redis host" "127.0.0.1")"
redis_port="$(prompt_value "Redis host port" "$(read_env_value REDIS_PORT 6379)")"
redis_password="$(prompt_value "Redis password (empty allowed)" "$(read_env_value REDIS_PASSWORD '')")"
redis_db="$(prompt_value "Redis database index" "$(read_env_value REDIS_DB 0)")"
server_port="$(prompt_value "Asagity API server port" "$(read_env_value SERVER_PORT 2048)")"
web_port="$(prompt_value "Asagity Web frontend port" "$(read_env_value WEB_PORT 2000)")"
tz="$(prompt_value "Timezone" "$(read_env_value TZ Asia/Shanghai)")"
jwt_secret="$(read_env_value JWT_SECRET asagity_secret_miku_39)"

echo
echo "Advanced options (press Enter to use default):"
echo "-------------------------------------------"
drive_storage_path="$(prompt_value "Drive storage path" "$(read_env_value DRIVE_STORAGE_PATH /app/storage/drive)")"
echo "-------------------------------------------"
echo

if [[ -f "${ENV_FILE}" ]]; then
  cp "${ENV_FILE}" "${ENV_FILE}.${BACKUP_SUFFIX}.bak"
  echo "Backed up existing .env to .env.${BACKUP_SUFFIX}.bak"
fi

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
REDIS_ADDR=${redis_host}:${redis_port}
REDIS_PASSWORD=${redis_password}
REDIS_DB=${redis_db}
REDIS_PORT=${redis_port}

# Security
JWT_SECRET=${jwt_secret}

# Storage
DRIVE_STORAGE_PATH=${drive_storage_path}
EOF

echo
echo "==============================================="
echo "  Configuration Complete!"
echo "==============================================="
echo
echo "PostgreSQL: ${db_host}:${db_port} (${db_name})"
echo "Redis:      ${redis_host}:${redis_port}"
echo "API Server: ${server_port}"
echo "Web Front: ${web_port}"
echo
echo "Configuration written to ${ENV_FILE}"
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
echo