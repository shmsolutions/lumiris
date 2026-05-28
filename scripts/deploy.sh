#!/usr/bin/env bash
# Pull the latest code and (re)deploy the full stack. Run from the repo root.
#
#   bash scripts/deploy.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.production"
COMPOSE="docker compose --env-file $ENV_FILE"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and fill it in first." >&2
  exit 1
fi

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Building and starting (migrations run automatically before the app)"
$COMPOSE up -d --build

echo "==> Pruning old images"
docker image prune -f

echo "==> Status"
$COMPOSE ps
echo
echo "Done. Tail logs with: $COMPOSE logs -f app"
