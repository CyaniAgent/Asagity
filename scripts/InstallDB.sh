#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
COMPOSE_DIR="${PROJECT_ROOT}/container/docker"

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

echo "==============================================="
echo "  Asagity Database Installer"
echo "==============================================="
echo

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Configuration file not found!"
  echo "Running initDatabase first..."
  echo
  
  if [[ -f "${SCRIPT_DIR}/container/initDatabase.sh" ]]; then
    bash "${SCRIPT_DIR}/container/initDatabase.sh"
  else
    echo "Error: initDatabase.sh not found!"
    exit 1
  fi
fi

read -p "Select installation method:
  1) Docker (recommended)
  2) Podman
  3) Native (local host)
  
Enter choice [1]: " install_method

case "${install_method}" in
  1) method="docker" ;;
  2) method="podman" ;;
  3) method="native" ;;
  *) method="docker" ;;
esac

echo
echo "Installation method: ${method}"
echo

db_host="$(read_env_value DB_HOST 127.0.0.1)"
db_port="$(read_env_value DB_PORT 5432)"
db_user="$(read_env_value DB_USER asagity)"
db_password="$(read_env_value DB_PASSWORD example_password)"
db_name="$(read_env_value DB_NAME asagity_db)"
redis_port="$(read_env_value REDIS_PORT 6379)"
redis_password="$(read_env_value REDIS_PASSWORD '')"

install_docker() {
  echo "Installing PostgreSQL + Redis via Docker..."
  echo
  
  cd "${COMPOSE_DIR}"
  
  if command -v docker &> /dev/null; then
    docker compose -f docker-compose-only-db.yaml up -d
    echo
    echo "Docker containers started!"
  else
    echo "Error: Docker is not installed!"
    exit 1
  fi
}

install_podman() {
  echo "Installing PostgreSQL + Redis via Podman..."
  echo
  
  cd "${PROJECT_ROOT}/container/podman"
  
  if command -v podman &> /dev/null; then
    if command -v podman-compose &> /dev/null; then
      podman-compose -f podman-compose-only-db.yaml up -d
    else
      echo "Note: podman-compose not found, using native podman commands..."
      
      podman run -d \
        --name asagity_postgres \
        -e POSTGRES_USER="${db_user}" \
        -e POSTGRES_PASSWORD="${db_password}" \
        -e POSTGRES_DB="${db_name}" \
        -p "${db_port}:5432" \
        -v asagity_postgres_data:/var/lib/postgresql/data \
        postgres:18.3-alpine3.23
      
      podman run -d \
        --name asagity_redis \
        -e REDIS_PASSWORD="${redis_password}" \
        -p "${redis_port}:6379" \
        -v asagity_redis_data:/data \
        redis:8.6.2-alpine redis-server --requirepass "${redis_password}" --appendonly yes
    fi
    echo
    echo "Podman containers started!"
  else
    echo "Error: Podman is not installed!"
    exit 1
  fi
}

install_native() {
  echo "Installing PostgreSQL + Redis on local host..."
  echo
  
  if command -v pg_isready &> /dev/null; then
    echo "PostgreSQL is already installed."
  else
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  CentOS/RHEL:   sudo yum install postgresql-server"
    echo "  macOS:         brew install postgresql"
    exit 1
  fi
  
  if command -v redis-cli &> /dev/null; then
    echo "Redis is already installed."
  else
    echo "Please install Redis first:"
    echo "  Ubuntu/Debian: sudo apt install redis-server"
    echo "  CentOS/RHEL:   sudo yum install redis"
    echo "  macOS:         brew install redis"
    exit 1
  fi
  
  echo
  echo "Starting services..."
  
  if command -v systemctl &> /dev/null; then
    sudo systemctl start postgresql
    sudo systemctl start redis
  elif command -v service &> /dev/null; then
    sudo service postgresql start
    sudo service redis-server start
  fi
  
  echo
  echo "Creating database and user..."
  
  sudo -u postgres psql -c "CREATE USER ${db_user} WITH PASSWORD '${db_password}';" 2>/dev/null || true
  sudo -u postgres psql -c "CREATE DATABASE ${db_name} OWNER ${db_user};" 2>/dev/null || true
  sudo -u postgres psql -c "ALTER USER ${db_user} WITH SUPERUSER;" 2>/dev/null || true
  
  echo
  echo "Local PostgreSQL and Redis are ready!"
}

case "${method}" in
  docker)  install_docker ;;
  podman)  install_podman ;;
  native)  install_native ;;
esac

echo
echo "==============================================="
echo "  Installation Complete!"
echo "==============================================="
echo
echo "Connection info:"
echo "  PostgreSQL: ${db_host}:${db_port} (${db_name})"
echo "  Redis:      ${db_host}:${redis_port}"
echo "  User:       ${db_user}"
echo
echo "Next step: cd ${PROJECT_ROOT}/core && go run ."