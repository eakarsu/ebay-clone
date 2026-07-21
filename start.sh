#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

if [[ -f "$PROJECT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
fi

if [[ ! -d "$BACKEND_DIR/node_modules" || ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Dependencies are missing. Run npm ci in backend/ and frontend/."
  exit 1
fi

if [[ "${APPLY_MIGRATIONS:-false}" == "true" ]]; then
  (cd "$BACKEND_DIR" && npm run migrate)
fi

cleanup() {
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd "$BACKEND_DIR" && HOST="${BACKEND_HOST:-127.0.0.1}" PORT="${BACKEND_PORT:-${PORT:-4000}}" npm start) &
BACKEND_PID=$!
(cd "$FRONTEND_DIR" && HOST="${FRONTEND_HOST:-127.0.0.1}" PORT="${FRONTEND_PORT:-3000}" BROWSER=none npm start) &
FRONTEND_PID=$!

echo "Backend and frontend started. This script never kills unrelated ports, reapplies the destructive base schema, or seeds data."
wait
