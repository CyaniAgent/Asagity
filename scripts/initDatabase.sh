#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
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

db_host="$(prompt_value "PostgreSQL host" "$(read_env_value DB_HOST 127.0.0.1)")"
db_port="$(prompt_value "PostgreSQL host port" "$(read_env_value DB_PORT 5432)")"
db_user="$(prompt_value "PostgreSQL user" "$(read_env_value DB_USER asagity)")"
db_password="$(prompt_value "PostgreSQL password" "$(read_env_value DB_PASSWORD example_password)")"
db_name="$(prompt_value "PostgreSQL database name" "$(read_env_value DB_NAME asagity_db)")"
redis_host="$(prompt_value "Redis host" "127.0.0.1")"
redis_port="$(prompt_value "Redis host port" "$(read_env_value REDIS_PORT 6379)")"
redis_password="$(prompt_value "Redis password (empty allowed)" "$(read_env_value REDIS_PASSWORD '')")"
redis_db="$(prompt_value "Redis database index" "$(read_env_value REDIS_DB 0)")"
server_port="$(prompt_value "Asagity API port" "$(read_env_value SERVER_PORT 2048)")"
jwt_secret="$(read_env_value JWT_SECRET asagity_secret_miku_39)"

if [[ -f "${ENV_FILE}" ]]; then
  cp "${ENV_FILE}" "${ENV_FILE}.${BACKUP_SUFFIX}.bak"
fi

cat > "${ENV_FILE}" <<EOF
SERVER_PORT=${server_port}

DB_HOST=${db_host}
DB_PORT=${db_port}
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}

REDIS_ADDR=${redis_host}:${redis_port}
REDIS_PASSWORD=${redis_password}
REDIS_DB=${redis_db}

POSTGRES_PORT=${db_port}
POSTGRES_USER=${db_user}
POSTGRES_PASSWORD=${db_password}
POSTGRES_DB=${db_name}
REDIS_PORT=${redis_port}

JWT_SECRET=${jwt_secret}
EOF

echo
echo "Database configuration written to ${ENV_FILE}"
echo "PostgreSQL will map to host port ${db_port}, Redis to host port ${redis_port}."
echo
echo "Next steps:"
echo "1. Start dependencies: docker compose up -d postgres redis"
echo "2. Start backend: cd core && go run ."
