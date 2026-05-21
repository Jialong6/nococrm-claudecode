#!/usr/bin/env bash
# NocoCRM 配置 + 数据备份脚本（T17.03）
# 用法：bash deploy/backup.sh
# 建议 crontab：0 2 * * * /path/to/deploy/backup.sh >> /var/log/nococrm-backup.log 2>&1
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.production"

# 读取保留天数（默认 30）
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$REPO_ROOT/storage/backups"
mkdir -p "$BACKUP_DIR"

echo "==> [1/3] 触发 NocoBase 备份（含 collection schema + 数据）"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T app yarn nocobase backup || {
  echo "ERROR: nocobase backup 失败"
  # 告警（plugin-nococrm-ops）
  curl -s -X POST "http://localhost:13000/api/ops:sendAlert" \
    -H "Content-Type: application/json" \
    -d '{"level":"critical","title":"备份失败","detail":"deploy/backup.sh nocobase backup 退出非 0"}' || true
  exit 1
}

echo "==> [2/3] 异地备份（S3 兼容，可选）"
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  # 需预装 awscli 并配置 endpoint
  LATEST="$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1 || true)"
  if [ -n "$LATEST" ]; then
    aws s3 cp "$LATEST" "s3://${BACKUP_S3_BUCKET}/nococrm/$(basename "$LATEST")" \
      ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"} || echo "WARN: S3 上传失败"
  fi
else
  echo "    未配置 BACKUP_S3_BUCKET，跳过异地备份"
fi

echo "==> [3/3] 清理 ${BACKUP_RETENTION_DAYS} 天前的本地备份"
find "$BACKUP_DIR" -name "*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true

echo "==> 备份完成：$BACKUP_DIR"
