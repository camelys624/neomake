#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="/var/www/shoe-ai-commerce"
ENV_FILE=""
SKIP_CI=0
SKIP_NGINX_RELOAD=0

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy.sh [options]

Options:
  --target <dir>         Deploy target directory (default: /var/www/shoe-ai-commerce)
  --env-file <file>      Optional env file to source before build
  --skip-ci              Skip `npm ci`
  --skip-nginx-reload    Skip `nginx -t` and `systemctl reload nginx`
  -h, --help             Show this help

Required env vars for current frontend build:
  VITE_IMAGE_MODEL_ENDPOINT
  VITE_IMAGE_MODEL_API_KEY

You can also provide IMAGE_MODEL_ENDPOINT / IMAGE_MODEL_API_KEY;
the script will map them to VITE_ variables for the Vite build.
EOF
}

while (($# > 0)); do
  case "$1" in
    --target)
      TARGET_DIR="${2:-}"
      shift 2
      ;;
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --skip-ci)
      SKIP_CI=1
      shift
      ;;
    --skip-nginx-reload)
      SKIP_NGINX_RELOAD=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Env file not found: $ENV_FILE" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -n "${IMAGE_MODEL_ENDPOINT:-}" && -z "${VITE_IMAGE_MODEL_ENDPOINT:-}" ]]; then
  export VITE_IMAGE_MODEL_ENDPOINT="$IMAGE_MODEL_ENDPOINT"
fi
if [[ -n "${IMAGE_MODEL_API_KEY:-}" && -z "${VITE_IMAGE_MODEL_API_KEY:-}" ]]; then
  export VITE_IMAGE_MODEL_API_KEY="$IMAGE_MODEL_API_KEY"
fi

if [[ -z "${VITE_IMAGE_MODEL_ENDPOINT:-}" ]]; then
  echo "Missing env: VITE_IMAGE_MODEL_ENDPOINT" >&2
  exit 1
fi
if [[ -z "${VITE_IMAGE_MODEL_API_KEY:-}" ]]; then
  echo "Missing env: VITE_IMAGE_MODEL_API_KEY" >&2
  exit 1
fi

for cmd in npm rsync sudo; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing command: $cmd" >&2
    exit 1
  fi
done

if ((SKIP_CI == 0)); then
  echo "==> Installing dependencies"
  npm ci
fi

echo "==> Building project"
npm run build

if [[ ! -d "$REPO_ROOT/dist" ]]; then
  echo "Build output missing: $REPO_ROOT/dist" >&2
  exit 1
fi

echo "==> Syncing dist/ -> $TARGET_DIR"
sudo mkdir -p "$TARGET_DIR"
sudo rsync -av --delete "$REPO_ROOT/dist/" "$TARGET_DIR/"

if ((SKIP_NGINX_RELOAD == 0)); then
  echo "==> Validating and reloading nginx"
  sudo nginx -t
  sudo systemctl reload nginx
fi

echo "Done. Deployed to $TARGET_DIR"
