#!/usr/bin/env bash
# Dumps the Postgres database to a gzipped file and prunes old backups.
# Run from the repo root. Schedule daily via cron (see bottom of this file).
#
#   bash scripts/backup.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.production"
BACKUP_DIR="${BACKUP_DIR:-$HOME/lume-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT="$BACKUP_DIR/lume_${STAMP}.sql.gz"

echo "==> Dumping database to $OUT"
docker compose --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUT"

echo "==> Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name 'lume_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

echo "Done. Current backups:"
ls -lh "$BACKUP_DIR"

# --- Schedule daily at 03:00 (run once) -----------------------------------
#   crontab -e
#   0 3 * * * cd $HOME/lume && bash scripts/backup.sh >> $HOME/lume-backups/backup.log 2>&1
#
# --- Restore a backup -----------------------------------------------------
#   gunzip -c lume_YYYY-MM-DD_HHMMSS.sql.gz | \
#     docker compose --env-file .env.production exec -T db psql -U lume -d lume
