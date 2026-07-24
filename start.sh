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

backend_port="${BACKEND_PORT:-${PORT:-}}"
frontend_port="${FRONTEND_PORT:-${CLIENT_PORT:-}}"
[[ "$backend_port" =~ ^[0-9]+$ ]] || { echo "BACKEND_PORT or PORT must be an assigned numeric port." >&2; exit 2; }
[[ "$frontend_port" =~ ^[0-9]+$ ]] || { echo "FRONTEND_PORT or CLIENT_PORT must be an assigned numeric port." >&2; exit 2; }
[[ "$backend_port" != "$frontend_port" ]] || { echo "Backend and frontend ports must differ." >&2; exit 2; }
for port in "$backend_port" "$frontend_port"; do
  if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use; no process was stopped." >&2
    exit 1
  fi
done

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

(cd "$BACKEND_DIR" && HOST="${BACKEND_HOST:-127.0.0.1}" PORT="$backend_port" npm start) &
BACKEND_PID=$!
(cd "$FRONTEND_DIR" && HOST="${FRONTEND_HOST:-127.0.0.1}" PORT="$frontend_port" BROWSER=none npm start) &
FRONTEND_PID=$!

echo "Backend and frontend started. This script never kills unrelated ports, reapplies the destructive base schema, or seeds data."
wait
