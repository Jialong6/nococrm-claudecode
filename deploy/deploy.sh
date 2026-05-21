#!/usr/bin/env bash
# NocoCRM 一键部署脚本（T17.05）
# 用法：bash deploy/deploy.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.production"

echo "==> NocoCRM 生产部署开始"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE 不存在。请先 cp deploy/.env.production.example deploy/.env.production 并填写。"
  exit 1
fi

echo "==> [1/5] 拉取最新代码"
git -C "$REPO_ROOT" pull --ff-only || echo "WARN: git pull 跳过（非 git 环境或有本地改动）"

echo "==> [2/5] 构建镜像"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build app

echo "==> [3/5] 启动数据库与缓存"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

echo "==> [4/5] 数据库迁移（首次 install / 后续 upgrade）"
# 首次部署用 install；后续升级用 upgrade
if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm app yarn nocobase upgrade; then
  echo "    迁移完成"
else
  echo "    upgrade 失败，尝试 install（首次部署）"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm app yarn nocobase install
fi

echo "==> [5/5] 启动全部服务"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo "==> 等待健康检查"
sleep 10
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo "==> 部署完成。访问 https://<你的域名>"
echo "    如首次部署，请确认已用 certbot 申请 HTTPS 证书。"
