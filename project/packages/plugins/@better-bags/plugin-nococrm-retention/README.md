# @better-bags/plugin-nococrm-retention

Better Bags NocoCRM 复盘与长期维护插件 — **M13 阶段 12 复盘与客户维护** + **M14 阶段 13 长期关系维护** 的可一键复现实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) 的 M13 + M14 共 **11 个任务**实现订单交付后的回路——把"已成交"客户转化为长期 VIP 资产。

启用后：

- 3 张业务表自动创建：`delivery_feedback` / `internal_retros` / `long_term_followups`
- `customers` 扩展 `last_order_at` 字段（T14.03 定时降级看此字段）
- **4 个数据库 Hooks**：
  1. T13.01 delivery_feedback.beforeCreate：从 shipment 自动同步 order / customer
  2. T13.04 delivery_feedback.afterSave：score≤2 → customer.risk_flag=true + order.notes 追加 `[LOW_SATISFACTION]`；score≥4 → 自动清除 risk_flag
  3. T13.05 orders.afterUpdate：status='delivered' AND balance_paid=true → 首单 customer.status='closed'；多单 customer.status='maintaining'；last_order_at 自动维护
  4. T14.04 inquiries.afterCreate：customer.status='maintaining' → 切回 'following' + notes 追加 `[LONG_TERM_REQUEST]`
- **3 份邮件模板**：thank-you-survey 中英日（T13.03 14 天感谢信 + 调研链接）

**这是 SOP 闭环的最后一个插件**——本插件启用后 SOP 13 阶段全部以代码形式落地。

## 依赖

- 必须先启用 `@better-bags/plugin-nococrm-core`（customers）
- 必须先启用 `@better-bags/plugin-nococrm-orders`（orders / payments）
- 必须先启用 `@better-bags/plugin-nococrm-fulfillment`（shipments）
- 必须先启用 `@better-bags/plugin-nococrm-quotation`（inquiries，T14.04 hook 监听对象）
- 推荐启用：`plugin-workflow*` / `plugin-public-forms`（公共反馈表单）

## 启用步骤

```bash
cd project
yarn install
yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 复盘与长期维护" → 启用
```

## 已实现任务对照

| tasks.md | 实现位置 | 状态 |
|----------|---------|------|
| T13.01 delivery_feedback 表 | `collections/deliveryFeedback.ts` + beforeCreate 同步 hook | 已做 |
| T13.02 internal_retros 表 | `collections/internalRetros.ts` 含 participants m2m | 已做 |
| T13.03 感谢信 + 调研 | 邮件模板 3 份 + README 14 天定时 | 已做+UI |
| T13.04 低分补救 | `delivery_feedback.afterSave` hook | 已做 |
| T13.05 订单完结状态更新 | `orders.afterUpdate` hook（首/多单 status 推进 + last_order_at） | 已做 |
| T13.06 M13 e2e | tests/m13-m14-e2e.md 场景 1-6 | 已做 |
| T14.01 季度回访 | 见下方手动配置清单 | UI |
| T14.02 long_term_followups 表 | `collections/longTermFollowups.ts` | 已做 |
| T14.03 长期不下单降级 | extendCollection customers.last_order_at + README 定时 | 字段+UI |
| T14.04 新需求回流 | `inquiries.afterCreate` hook | 已做 |
| T14.05 M14 e2e | tests/m13-m14-e2e.md 场景 7-10 | 已做 |

## 业务红线对应

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| 满意度 ≤ 2 触发补救 | SOP 阶段 12 | `delivery_feedback.afterSave` hook |
| 首单 closed / 多单 maintaining | SOP 阶段 12 T13.05 | `orders.afterUpdate` hook |
| 4 频次回访（A 月 / B 季 / C 半年 / D 年）| SOP 阶段 13 | README 定时工作流 |
| 180 天不下单降级 | SOP 阶段 13 T14.03 | last_order_at 字段 + README 定时 |
| 长期客户新询盘自动回流 | SOP 阶段 13 T14.04 | `inquiries.afterCreate` hook |

## 手动配置清单

### T13.03 14 天感谢信定时
路径：工作流管理 → 创建定时触发流程

- 触发：定时（每天 9:00 北京时间）
- 查询：`shipments` filter `delivered_at IS NOT NULL AND delivered_at <= now - 14d AND id NOT IN (SELECT shipment_id FROM delivery_feedback)`
- 循环节点：每条记录
  - sendEmail to customer.email（模板 thank-you-survey-<lang>，按 customer.country 路由）
  - 变量：survey_url（指向 plugin-public-forms 创建的 delivery_feedback 公共表单）

### T14.01 季度回访定时
路径：工作流管理 → 创建定时触发流程

- 触发：每月 1 号 9:00
- 4 个分支（按 customers.priority）：
  - **A 类**：查询 `customers.priority='A' AND status NOT IN ('lost','new')` AND 本月无 long_term_followups → 创建 long_term_followups (type=quarterly_review, scheduled_at=今天+3d)
  - **B 类**：每季度首月（1、4、7、10 月）→ 同上
  - **C 类**：每半年首月（1、7 月）→ 同上
  - **D 类**：每年首月（1 月）→ 群发节日邮件

### T14.03 180 天不下单降级
- 触发：定时（每天 9:00）
- 查询：`customers WHERE (last_order_at IS NULL OR last_order_at < now - 180d) AND priority IN ('A','B')`
- 节点：
  - priority='A' → 改 'B'，notes 追加 `[YYYY-MM-DD] 180 天无新订单，从 A 降至 B`
  - priority='B' → 改 'C'，类似 notes 追加
  - C 类不再降级

### 公共反馈表单
- 启用 `plugin-public-forms`
- 暴露 delivery_feedback 公共提交链接（含 shipment_id 参数）
- 嵌入到 thank-you-survey 邮件的 {{survey_url}} 变量
- 表单提交后 hook 自动同步 order / customer + risk_flag 维护

### 质量反馈视图
- 数据表：delivery_feedback
- 看板分列：按 satisfaction_score（1-2 红、3 黄、4-5 绿）
- 质量经理优先处理 score ≤ 3 的反馈

### 长期跟进看板
- 数据表：long_term_followups
- 分组：customer.priority (A/B/C/D)
- 卡片字段：type + scheduled_at + outcome
- 业务员按 owner 筛选自己的待办

## 目录结构

```text
plugin-nococrm-retention/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # extendCollection + 4 hooks
│   │   └── collections/
│   │       ├── deliveryFeedback.ts         # T13.01
│   │       ├── internalRetros.ts           # T13.02
│   │       └── longTermFollowups.ts        # T14.02
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── assets/
│   └── email-templates/
│       ├── thank-you-survey-zh.html
│       ├── thank-you-survey-en.html
│       └── thank-you-survey-ja.html
└── tests/
    └── m13-m14-e2e.md
```

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用报"必须先启用 plugin-nococrm-fulfillment" | shipments 表未就绪 | 先启用 fulfillment |
| delivery_feedback 创建后 order / customer 没自动填 | shipment 未填或 hook 异常 | 查后端日志 `[nococrm-retention]` |
| 评分 5 但 risk_flag 没清除 | 客户当前 risk_flag 是 false | 设计如此（只在评分 ≥ 4 强制清零）|
| order.delivered 但 customer.status 没推进 | balance_paid=false | 必须 balance_paid=true 才推进 |
| customer.status 一直是 'maintaining' | 长期未新询盘 | 设计如此；新询盘会自动切回 following |
| last_order_at 字段不显示 | beforeLoad extendCollection 未生效 | 重启 yarn dev |

## 升级路径

后续里程碑（全局横向）：
- M15 阶段 14 ACL 完整实现 → `@better-bags/plugin-nococrm-acl`（finance / sales_manager 角色字段级隔离）
- M16 报表 → `@better-bags/plugin-nococrm-reports`（13 阶段漏斗 / 销售业绩 / 工厂产能 / 财务现金流）
- M17 验收上线 → 测试 / Docker 部署 / 监控告警

## License

AGPL-3.0
