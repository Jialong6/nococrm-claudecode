# NocoCRM 运维手册 (Runbook)

日常运维 + 故障处理 + 告警响应。

## 日常运维

### 查看日志
```bash
docker compose -f deploy/docker-compose.prod.yml logs -f app
# 或日志文件（LOGGER_TRANSPORT=dailyRotateFile）
ls project/storage/logs/
```

### 重启服务
```bash
docker compose -f deploy/docker-compose.prod.yml restart app
```

### 备份 / 还原
```bash
bash deploy/backup.sh                              # 手动备份
yarn nocobase restore storage/backups/<file>.dump  # 还原
```

### 升级
```bash
git pull && bash deploy/deploy.sh   # 自动跑 upgrade 迁移
```

## 监控告警（plugin-nococrm-ops）

### 告警渠道
- 站内信 → admin
- 邮件 → OPS_ALERT_EMAIL
- webhook → OPS_ALERT_WEBHOOK（钉钉/飞书）

### 告警项与响应

| 告警 | 级别 | 响应 |
|------|------|------|
| 应用错误（数据库连接失败）| critical | 立即查 postgres 容器健康 + 网络 |
| 邮件失败 > 5 次/小时 | warning | 查 SMTP 配置 / 额度 / 收件人 |
| 工作流失败 | warning | 工作流管理看 execution 日志 |
| 备份失败 | critical | 手动跑 backup.sh 看报错 |

### 告警测试
```bash
curl -X POST https://nococrm.example.com/api/ops:testAlert -H "Authorization: Bearer <admin-token>"
```

## 常见故障处理

### 1. 页面打不开
- 查 nginx：`docker compose ... logs nginx`
- 查 app 健康：`docker compose ... ps`
- 查证书是否过期：`certbot certificates`

### 2. 数据库连接失败
- `docker compose ... ps postgres` 是否 healthy
- 检查 .env.production 的 DB_PASSWORD 与 postgres 容器一致
- 连接数耗尽：postgres max_connections=200，必要时调高

### 3. 邮件发不出去
- SMTP 配置（host/port/user/pass）
- 腾讯企业邮需用授权码而非登录密码
- 端口 465（SSL）/ 587（STARTTLS）

### 4. 工作流不触发
- 确认 plugin-workflow* 已启用
- 定时工作流需 plugin-workflow-schedule
- 查 execution 状态

### 5. 插件启用报错
- 依赖顺序：core 必须最先
- `yarn nocobase upgrade` 重跑迁移
- 查 `[nococrm-*]` 前缀错误日志

### 6. 业务自动化（hook）失效
- 所有 hook 用 try/catch，错误打到日志 `[nococrm-<plugin>]`
- hook 不会阻断主流程（除业务红线 throw）
- 排查：搜对应插件日志前缀

## 定期维护

| 周期 | 任务 |
|------|------|
| 每天 | 自动备份（crontab 2:00）|
| 每周 | 查看告警汇总 / 磁盘空间 |
| 每月 | 还原演练 / 日志归档 / 依赖安全更新 |
| 每季 | HTTPS 证书检查 / 性能评估 / 大版本升级评估 |

## 关键路径速查

| 内容 | 路径 |
|------|------|
| 业务插件 | `project/packages/plugins/@better-bags/` |
| 部署物料 | `deploy/` |
| 备份产物 | `project/storage/backups/` |
| 日志 | `project/storage/logs/` |
| 业务知识库 | 仓库根 `01-06.md` |
| 任务蓝图 | 仓库根 `tasks.md` |
