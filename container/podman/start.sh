#!/usr/bin/env bash
#===============================================================================
# Asagity Podman Startup Script
# Starts PostgreSQL and Redis containers for Asagity backend
#===============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/podman-compose.yaml"
ENV_FILE="${PROJECT_ROOT}/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

check_podman() {
    if ! command -v podman &> /dev/null; then
        error "Podman is not installed. Please install Podman first."
        echo "  Ubuntu/Debian: sudo apt-get install podman"
        echo "  Fedora/RHEL:   sudo dnf install podman"
        echo "  Arch:          sudo pacman -S podman"
        exit 1
    fi
    info "Podman version: $(podman --version)"
}

get_compose_cmd() {
    if podman compose version &> /dev/null 2>&1; then
        echo "podman compose -f ${COMPOSE_FILE}"
    elif command -v podman-compose &> /dev/null; then
        echo "podman-compose -f ${COMPOSE_FILE}"
    else
        error "No podman compose tool found. Install podman-compose or use Podman 4.x+"
        exit 1
    fi
}

load_env() {
    if [[ -f "${ENV_FILE}" ]]; then
        info "Loading environment from ${ENV_FILE}"
        set -a
        source "${ENV_FILE}"
        set +a
    fi
}

start_services() {
    info "Starting Asagity services..."
    COMPOSE_CMD="$(get_compose_cmd)"
    info "Using: ${COMPOSE_CMD}"
    
    cd "${PROJECT_ROOT}"
    ${COMPOSE_CMD} up -d
    
    success "Services started!"
    sleep 2
    check_status
}

check_status() {
    echo ""
    info "Container Status:"
    echo ""
    podman ps -a --format "{{.Names}}\t{{.Status}}" | grep asagity || echo "  No Asagity containers found."
    echo ""
}

show_help() {
    cat << EOF
${BLUE}Asagity Podman Startup Script${NC}

Usage: $(basename "$0") [OPTIONS]

OPTIONS:
    -h, --help      Show this help message
    -s, --status    Check container status only
    -r, --restart   Restart all services
    -c, --clean     Stop and remove all containers and volumes

EXAMPLES:
    $(basename "$0")              # Start all services
    $(basename "$0") --status     # Check status only
    $(basename "$0") --restart     # Restart all services
    $(basename "$0") --clean       # Clean up everything

NEXT STEPS:
    1. Start backend: cd core && go run .
    2. Start frontend: cd web && npm run dev

EOF
}

case "${1:-}" in
    -h|--help) show_help; exit 0 ;;
    -s|--status)
        check_podman
        check_status
        exit 0
        ;;
    -r|--restart)
        check_podman
        cd "${PROJECT_ROOT}"
        $(get_compose_cmd) restart
        success "Services restarted!"
        check_status
        exit 0
        ;;
    -c|--clean)
        check_podman
        warn "This will remove all containers and volumes!"
        read -r -p "Are you sure? [y/N] " confirm
        if [[ "${confirm}" =~ ^[Yy]$ ]]; then
            cd "${PROJECT_ROOT}"
            $(get_compose_cmd) down -v
            success "Cleanup complete!"
        fi
        exit 0
        ;;
    "")
        check_podman
        load_env
        start_services
        ;;
    *)
        error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
