#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PYTHON_BIN="/usr/bin/python3"
GUARD_SCRIPT="$PROJECT_DIR/scripts/menu_image_guard.py"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/menu_image_guard.log"

mkdir -p "$LOG_DIR"

CRON_EXPR="*/30 * * * *"
CRON_CMD="cd '$PROJECT_DIR' && $PYTHON_BIN '$GUARD_SCRIPT' >> '$LOG_FILE' 2>&1"
CRON_LINE="$CRON_EXPR $CRON_CMD"

CURRENT_CRON="$(crontab -l 2>/dev/null || true)"

if printf "%s\n" "$CURRENT_CRON" | grep -F "$GUARD_SCRIPT" >/dev/null 2>&1; then
    echo "Cron job already exists for menu_image_guard.py"
    exit 0
fi

{
    printf "%s\n" "$CURRENT_CRON"
    printf "%s\n" "$CRON_LINE"
} | crontab -

echo "Cron job installed: every 30 minutes"
echo "Log file: $LOG_FILE"
