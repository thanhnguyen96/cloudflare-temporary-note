#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="note-24h"
API_BASE_URL=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-name)
      PROJECT_NAME="${2:-}"
      shift 2
      ;;
    --api-base-url)
      API_BASE_URL="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WRANGLER_TOML="${REPO_ROOT}/worker/wrangler.toml"

step() {
  local name="$1"
  shift

  echo
  echo "==> ${name}"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Dry-run: skipped execution."
    return 0
  fi

  "$@"
}

extract_toml_value() {
  local key="$1"
  local file="$2"
  local line
  line="$(grep -E "^${key}[[:space:]]*=" "$file" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    echo ""
    return 0
  fi
  echo "$line" | sed -E 's/^[^=]*=[[:space:]]*"?([^"#]+)"?.*$/\1/' | xargs
}

assert_worker_config() {
  if [[ ! -f "$WRANGLER_TOML" ]]; then
    echo "Missing worker/wrangler.toml" >&2
    exit 1
  fi

  local database_id
  local r2_account
  local r2_access_key

  database_id="$(extract_toml_value "database_id" "$WRANGLER_TOML")"
  r2_account="$(extract_toml_value "R2_ACCOUNT_ID" "$WRANGLER_TOML")"
  r2_access_key="$(extract_toml_value "R2_ACCESS_KEY_ID" "$WRANGLER_TOML")"

  if [[ -z "$database_id" || "$database_id" == "REPLACE_WITH_D1_DATABASE_ID" ]]; then
    echo "Invalid D1 database_id in worker/wrangler.toml." >&2
    exit 1
  fi

  if [[ -z "$r2_account" || "$r2_account" == "REPLACE_WITH_CF_ACCOUNT_ID" ]]; then
    echo "Invalid R2_ACCOUNT_ID in worker/wrangler.toml." >&2
    exit 1
  fi

  if [[ -z "$r2_access_key" || "$r2_access_key" == "REPLACE_WITH_R2_ACCESS_KEY_ID" ]]; then
    echo "Invalid R2_ACCESS_KEY_ID in worker/wrangler.toml." >&2
    exit 1
  fi
}

read_api_base_from_env_files() {
  local candidates=(
    "${REPO_ROOT}/frontend/.env.local"
    "${REPO_ROOT}/frontend/.env.production"
    "${REPO_ROOT}/frontend/.env"
    "${REPO_ROOT}/.env"
  )

  local file value
  for file in "${candidates[@]}"; do
    [[ -f "$file" ]] || continue

    value="$(awk '
      {
        gsub(/\r/, "", $0)
        sub(/^\xef\xbb\xbf/, "", $0)
      }
      /^[[:space:]]*#/ { next }
      /^[[:space:]]*$/ { next }
      /^[[:space:]]*VITE_API_BASE[[:space:]]*=/ {
        sub(/^[[:space:]]*VITE_API_BASE[[:space:]]*=[[:space:]]*/, "", $0)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", $0)
        gsub(/^"/, "", $0)
        gsub(/"$/, "", $0)
        gsub(/^'\''/, "", $0)
        gsub(/'\''$/, "", $0)
        print $0
        exit
      }
    ' "$file")"

    if [[ -n "$value" ]]; then
      echo "$value"
      return 0
    fi
  done

  echo ""
}

resolve_api_base_url() {
  local value="$API_BASE_URL"

  if [[ -z "$value" ]]; then
    value="$(read_api_base_from_env_files)"
  fi

  if [[ -z "$value" ]]; then
    echo "Missing ApiBaseUrl. Set VITE_API_BASE in frontend/.env.local, frontend/.env.production, or frontend/.env (or pass --api-base-url)." >&2
    exit 1
  fi

  if [[ ! "$value" =~ ^https?:// ]]; then
    value="https://${value}"
  fi

  if [[ ! "$value" =~ ^https:// ]]; then
    echo "ApiBaseUrl must start with https://" >&2
    exit 1
  fi

  if [[ "$value" == *"pages.dev"* ]]; then
    echo "ApiBaseUrl must point to Worker domain, not Pages domain." >&2
    exit 1
  fi

  echo "${value%/}"
}

cd "$REPO_ROOT"

assert_worker_config
RESOLVED_API_BASE="$(resolve_api_base_url)"

step "Build frontend" env VITE_API_BASE="$RESOLVED_API_BASE" npm run build:frontend
step "Build worker (dry-run deploy package)" npm run build:worker
step "Deploy worker" npm run deploy:worker
step "Deploy pages project '${PROJECT_NAME}'" npx wrangler pages deploy frontend/dist --project-name "$PROJECT_NAME"

echo
echo "Deployment completed."
