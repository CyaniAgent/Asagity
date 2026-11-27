#!/usr/bin/env bash
#===============================================================================
# Asagity Podman Stop Script
# Stops and optionally removes PostgreSQL and Redis containers
#===============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/podman-compose.yaml"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }

get_compose_cmd() {
    if podman compose version &> /dev/null 2>&1; then
        echo "podman compose -f ${COMPOSE_FILE}"
    else
        echo "podman-compose -f ${COMPOSE_FILE}"
    fi
}

run_compose() {
    cd "${PROJECT_ROOT}"
    $(get_compose_cmd) "$@"
}

show_status() {
    echo ""
    info "Current Container Status:"
    echo ""
    podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep asagity || echo "  No Asagity containers running."
    echo ""
}

show_help() {
    cat << EOF
${BLUE}Asagity Podman Stop Script${NC}

Usage: $(basename "$0") [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -s, --stop         Stop containers (keep volumes)
    -r, --remove        Stop and remove containers (keep volumes)
    -v, --volumes      Stop, remove containers and delete volumes
    --status           Show container status

EXAMPLES:
    $(basename "$0") --stop      # Stop containers
    $(basename "$0") --remove    # Stop and remove containers
    $(basename "$0") --volumes   # Complete cleanup (WARNING: deletes data!)

EOF
}

case "${1:-}" in
    -h|--help) show_help ;;
    -s|--stop)
        info "Stopping services..."
        run_compose stop
        success "Services stopped!"
        ;;
    -r|--remove)
        info "Stopping and removing containers..."
        run_compose stop
        run_compose rm -f
        success "Containers removed!"
        ;;
    -v|--volumes)
        info "Complete cleanup..."
        run_compose down -v
        success "Cleanup complete!"
        ;;
    --status)
        show_status
        ;;
    "")
        show_help
        ;;
    *)
        echo -e "${RED}[ERROR]${NC} Unknown option: $1"
        show_help
        exit 1
        ;;
esac
