# @better-bags/plugin-nococrm-ops

Better Bags NocoCRM 运维与告警插件 — **M17 T17.06 监控告警** 的实现。

## 这是什么

提供统一告警渠道与错误监听，让生产环境的异常能第一时间通知到运维/管理员。

启用后：

- **2 个 action**：
  - `ops:sendAlert`（供 UI 工作流"失败分支"调用，登录用户可用）
  - `ops:testAlert`（手动测试告警链路，admin）
- **3 个告警渠道**（alertChannels.ts，含 5 分钟节流去重）：
  1. 站内信 → admin 角色
  2. 邮件 → `OPS_ALERT_EMAIL`
  3. webhook → `OPS_ALERT_WEBHOOK`（钉钉/飞书 markdown 格式）
- **错误监听**：
  - app error（数据库连接失败等） → critical 告警
  - 邮件发送失败 > 5 次/小时 → warning 告警
  - 启动健康检查日志

## 环境变量

```bash
OPS_ALERT_EMAIL=ops@betterbags.example       # 告警邮件收件人
OPS_ALERT_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxx  # 可选
```

## 启用步骤

```bash
cd project && yarn install && yarn dev
# 插件管理 → "NocoCRM 运维与告警" → 启用
# 配置 OPS_ALERT_EMAIL / OPS_ALERT_WEBHOOK 后重启
```

## 测试告警链路

```bash
# 手动触发测试告警（需 admin 登录态）
curl -X POST http://localhost:13000/api/ops:testAlert -H "Authorization: Bearer <token>"
# 预期：站内信 + 邮件 + webhook（已配置的渠道）收到"测试告警"
```

## 在 UI 工作流中调用 ops:sendAlert（T17.06 核心用法）

NocoBase 工作流的细粒度节点失败无法被插件直接监听，推荐在关键工作流加"失败分支"：

1. 工作流管理 → 打开某个关键流程（如尾款催收 / 排产通知）
2. 给关键节点加"失败时"分支
3. 失败分支添加"HTTP 请求"节点 → POST `/api/ops:sendAlert`
4. body：`{ "level": "warning", "title": "尾款催收邮件发送失败", "detail": "{{$context.error}}" }`

## 告警项对照（tasks.md T17.06）

| 告警项 | 监听方式 | 级别 |
|--------|---------|------|
| 工作流失败 | UI 工作流失败分支调用 ops:sendAlert | warning |
| 邮件发送失败 > 5 次/小时 | `notifications.afterCreate` status=failed 计数 | warning |
| 数据库连接失败 | `app.on('error')` | critical |
| 备份失败 | deploy/backup.sh 失败时 curl ops:sendAlert | critical |

## 节流机制

同一 `dedupeKey`（默认 `level:title`）在 5 分钟内只发一次，避免告警风暴。`ops:testAlert` 用时间戳作为 key，不节流。

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| testAlert 没收到邮件 | OPS_ALERT_EMAIL 未配置 / SMTP 未启用 | 检查 env + plugin-notification-email |
| webhook 不通 | OPS_ALERT_WEBHOOK 错误 / 钉钉加签 | 检查 webhook URL；钉钉需关键词或加签 |
| 告警太频繁 | 节流窗口太短 | 调 alertChannels.ts 的 THROTTLE_WINDOW_MS |
| 邮件失败计数不触发 | notifications 表结构不同 | 改用 UI 工作流失败分支兜底 |

## 目录结构

```text
plugin-nococrm-ops/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # 注册 action + 错误监听
│   │   └── alertChannels.ts                # 3 渠道 + 节流
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
└── tests/
    └── m17-ops-e2e.md
```

## License

AGPL-3.0
