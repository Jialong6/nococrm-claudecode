# M17 运维告警测试清单 (T17.06)

## 准备
- 启用 plugin-nococrm-ops
- 配置 OPS_ALERT_EMAIL（必填测邮件）/ OPS_ALERT_WEBHOOK（可选测 webhook）
- 启用 plugin-notification-email + plugin-notification-in-app-message

---

## 场景 1：testAlert 三渠道
- POST `/api/ops:testAlert`（admin）
- 期望：
  - [ ] 响应 `{ ok: true, channels: [...] }`
  - [ ] OPS_ALERT_EMAIL 收到"测试告警"邮件
  - [ ] admin 收到站内信
  - [ ] webhook（如配置）收到钉钉/飞书消息

## 场景 2：sendAlert 自定义
- POST `/api/ops:sendAlert` body `{level:'critical', title:'数据库连接失败', detail:'connection timeout'}`
- 期望：
  - [ ] 各渠道收到 🔴 critical 告警

## 场景 3：节流去重
- 连续 2 次 POST sendAlert 相同 title
- 期望：
  - [ ] 第 2 次响应 `{ skipped: true }`，不重复发送
- 等 5 分钟后再发
- 期望：
  - [ ] 正常发送（窗口过期）

## 场景 4：title 必填校验
- POST sendAlert body 不含 title
- 期望：
  - [ ] 400 报错 "title 不能为空"

## 场景 5：工作流失败分支调用（手动配置后）
- 按 README 在某工作流加失败分支 → ops:sendAlert
- 故意让该工作流失败
- 期望：
  - [ ] 收到该工作流的失败告警

## 场景 6：邮件失败计数
- 故意配错 SMTP，触发 6 封邮件失败
- 期望：
  - [ ] 第 5 次后收到"邮件发送失败已达 N 次/小时"告警

## 场景 7：ACL
- 非 admin 调用 ops:testAlert
- 期望：
  - [ ] 403（testAlert 仅 admin）
- 登录用户调用 ops:sendAlert
- 期望：
  - [ ] 通过（供工作流调用）

---

## 验收勾选
- [ ] 场景 1-2：告警发送
- [ ] 场景 3-4：节流 + 校验
- [ ] 场景 5-6：错误监听
- [ ] 场景 7：ACL

## 已知缺陷与未覆盖项
- NocoBase 工作流细粒度节点失败无法被插件直接监听，靠 UI 失败分支调用 ops:sendAlert 兜底
- 邮件失败计数依赖 notifications 表结构，不同版本字段可能不同
- 站内信发送的具体 API 视 NocoBase 版本，README 提供备选
- 告警节流是单进程内存计数；CLUSTER_MODE 多进程下各进程独立节流（可接受）
