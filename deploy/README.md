# NocoCRM 生产部署（M17 T17.05）

Docker Compose 一栈部署：NocoBase app + PostgreSQL 16 + Redis 7 + Nginx（HTTPS）。

## 前置要求

- Linux 服务器（2C4G 起，推荐 4C8G）
- Docker 24+ / Docker Compose v2
- 已解析到服务器的域名（用于 HTTPS）
- 开放 80 / 443 端口

## 部署步骤

### 1. 准备环境变量
```bash
cp deploy/.env.production.example deploy/.env.production
# 编辑 deploy/.env.production，至少修改：
#   APP_KEY（openssl rand -base64 32）
#   DB_PASSWORD
#   SMTP_*
#   OPS_ALERT_EMAIL
```

### 2. 申请 HTTPS 证书（首次）
```bash
# 安装 certbot
sudo apt install certbot
# 临时停掉占用 80 的服务后申请
sudo certbot certonly --standalone -d nococrm.example.com
# 证书会生成在 /etc/letsencrypt/live/nococrm.example.com/
# 修改 deploy/nginx/nococrm.conf 里的域名
```

### 3. 一键部署
```bash
bash deploy/deploy.sh
```
脚本会：拉代码 → 构建镜像 → 起 DB/Redis → 迁移（install/upgrade）→ 起全部服务 → 健康检查。

### 4. 启用插件（首次）
浏览器访问 `https://nococrm.example.com` → 创建管理员 → 插件管理，**按依赖顺序启用**：

```
1. plugin-nococrm-core        (M1/M2 基础)
2. plugin-nococrm-meetings    (M3/M4)
3. plugin-nococrm-quotation   (M5/M6)
4. plugin-nococrm-followup    (M7/M8)
5. plugin-nococrm-orders      (M9/M10)
6. plugin-nococrm-fulfillment (M11/M12)
7. plugin-nococrm-retention   (M13/M14)
8. plugin-nococrm-acl         (M15)
9. plugin-nococrm-reports     (M16)
10. plugin-nococrm-ops        (M17)
```

## 备份（T17.03）

```bash
# 手动备份
bash deploy/backup.sh

# 自动备份（每天凌晨 2 点）
crontab -e
# 添加：
0 2 * * * /path/to/nocoCRM-ClaudeCode/deploy/backup.sh >> /var/log/nococrm-backup.log 2>&1
```

备份产物在 `storage/backups/`，配置 `BACKUP_S3_*` 后自动异地上传。

## 还原

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production \
  exec app yarn nocobase restore /app/nocobase/storage/backups/<backup-file>.dump
```

## 升级

```bash
git pull
bash deploy/deploy.sh   # 自动跑 nocobase upgrade 迁移
```

## 回滚

```bash
# 1. 切回上一个 commit
git checkout <上一个稳定 tag>
# 2. 还原数据库快照
bash deploy/restore.sh <上线前的备份>
# 3. 重新部署
bash deploy/deploy.sh
```

## 监控

- 日志：`docker compose -f deploy/docker-compose.prod.yml logs -f app`
- 告警：plugin-nococrm-ops（配置 OPS_ALERT_EMAIL / OPS_ALERT_WEBHOOK）
- 健康检查：compose 内置 healthcheck（app `/api/app:getInfo`）

## 文件说明

| 文件 | 用途 |
|------|------|
| docker-compose.prod.yml | 生产编排（4 服务）|
| .env.production.example | 环境变量模板 |
| nginx/nococrm.conf | HTTPS 反代配置 |
| deploy.sh | 一键部署 |
| backup.sh | 备份脚本（T17.03）|

## 安全提示

- `.env.production` 含密钥，**已被 .gitignore 屏蔽**，切勿提交
- 定期轮换 APP_KEY / DB_PASSWORD / SMTP_PASS
- HTTPS 证书 90 天到期，配置 certbot 自动续期：`certbot renew --dry-run`
