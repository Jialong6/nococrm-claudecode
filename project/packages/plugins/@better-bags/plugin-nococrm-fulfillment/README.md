# @better-bags/plugin-nococrm-fulfillment

Better Bags NocoCRM 生产质检与发货插件 — **M11 阶段 10 生产与质检** + **M12 阶段 11 发货交付** 的可一键复现实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) 的 M11 + M12 共 **15 个任务**把"在 NocoBase UI 里手点"的生产监控、质检报告、发货 3 张主表，以及订单履约关键自动化，全部封装成一个标准 NocoBase 插件。

启用后：

- 3 张业务表自动创建：`production_progress` / `qc_reports` / `shipments`
- `orders` 扩展 `customer_inspection_required` 字段（T11.05 通过 extendCollection 注入）
- **6 个数据库 Hooks**（启用即生效）：
  1. T11.01 production_progress.beforeSave：order 从 production_plan 自动同步；cumulative_qty 自动 = 前置 completed_qty 之和 + 本次（跨记录累加）
  2. T11.04 production_progress.afterCreate：issues 非空 → 写 order.notes 追加 `[YYYY-MM-DD PROD_ISSUE]` 标记
  3. T11.06 qc_reports.afterSave：pass=true AND is_final_internal=true → order.status='completed'
  4. T12.02 shipments.beforeCreate：order.balance_paid=false 且非 VIP → throw（VIP = customer.status=closed AND orders ≥ 3）
  5. T12.05 shipments.beforeSave：status='shipped' 时三个文件（invoice/packing_list/origin_cert）齐套校验
  6. T12.03/T12.04 shipments.afterUpdate：bl_no 从空 → 非空 时自动填 atd；status 同步推进 order（shipped/delivered）
- **6 份邮件模板**：
  - balance-invitation-zh/en/ja.html（T11.06 尾款邀请）
  - shipment-notification-zh/en/ja.html（T12.03/T12.04 提单号通知 + 状态推送，复用 + status 变量）

启用此插件后，订单履约链完全闭环：
```
qc 通过 → order.completed → 财务收尾款 → balance_paid=true
     → 业务员创建 shipment（hook 校验 balance_paid 或 VIP）
     → order.shipping_pending → 填提单号（自动填 atd）
     → 上传 3 份文件 → status=shipped → order.shipped
     → status=delivered → order.delivered（delivered_at 自动）
```

## 依赖

- 必须先启用 `@better-bags/plugin-nococrm-core`（customers / factories）
- 必须先启用 `@better-bags/plugin-nococrm-orders`（orders / production_plans / payments）
- 推荐启用：`plugin-kanban` / `plugin-workflow*` / `plugin-notification-email` / `plugin-field-sequence`

## 启用步骤

```bash
cd project
yarn install
yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 生产质检与发货" → 启用
```

## 已实现任务对照

| tasks.md | 实现位置 | 状态 |
|----------|---------|------|
| T11.01 production_progress 表 | `collections/productionProgress.ts` + beforeSave 累加 hook | 已做 |
| T11.02 qc_reports 表 | `collections/qcReports.ts` | 已做 |
| T11.03 AQL 默认 2.5 | qc_reports.aql_level defaultValue=2.5 | 已做 |
| T11.04 生产异常通知 | `production_progress.afterCreate` hook 写 order.notes | 已做 |
| T11.05 验厂任务 | extendCollection orders.customer_inspection_required + README 定时 | 已做+UI |
| T11.06 QC 通过 → 尾款 | `qc_reports.afterSave` hook → order.status='completed' + 邮件模板 | 已做+模板 |
| T11.07 生产/质检看板 | README | UI |
| T11.08 M11 e2e | tests/m11-m12-e2e.md 场景 1-7 | 已做 |
| T12.01 shipments 表 | `collections/shipments.ts` | 已做 |
| T12.02 尾款才能发货 | `shipments.beforeCreate` hook + VIP 例外 | 已做 |
| T12.03 提单号通知 | `shipments.afterUpdate` hook 自动填 atd + README 邮件 | 已做+模板 |
| T12.04 运输状态推送 | `shipments.afterUpdate` 同步 order.status + README 邮件 | 已做+模板 |
| T12.05 文件齐套校验 | `shipments.beforeSave` hook 三文件校验 | 已做 |
| T12.06 发货跟踪视图 | README | UI |
| T12.07 M12 e2e | tests/m11-m12-e2e.md 场景 8-14 | 已做 |

## 业务红线对应

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| AQL 2.5 抽检 | 01 知识库 | qc_reports.aql_level 默认 2.5 |
| 5 个生产里程碑（裁断/缝制/钉胶/检针/包装）| 02 知识库 | M10 production_plans 字段（本插件不重建）|
| X 线检针机 | 02 知识库 | qc_reports.type=metal_detect |
| 尾款发货前付清 | 06 知识库 | `shipments.beforeCreate` hook throw |
| VIP T/T 见提单（已成交+3 单） | 06 知识库 | VIP 例外判定 |
| 出货文件三件套 | 行业惯例 | `shipments.beforeSave` 齐套校验 |

## 手动配置清单

### T11.05 验厂任务定时工作流
- 触发：定时（每天 9:00 北京时间）
- 查询：`orders` filter `customer_inspection_required=true` AND 关联 `production_plans.planned_start <= today + 3d` AND `production_plans.status='pending'`
- 节点：循环 → 创建任务给 QC team → 任务内容含 `order.notes`（特殊要求）

### T11.06 尾款邀请邮件
- 触发：collection.afterUpdate on orders
- 条件：status 变成 'completed'
- 节点：sendEmail to customer.email，模板 `balance-invitation-<lang>`（按 customer.country 路由）
- 变量：order.* / customer.* / payment.*（找该 order 的尾款 payment）/ user.*（owner）

### T11.07 生产看板
- 数据表：production_progress
- 分组：production_plan
- 聚合卡片：sum(completed_qty) / 最近 cumulative_qty / issues 计数

### T11.07 质检看板
- 数据表：qc_reports
- 看板分列：按 type 4 列（aql_internal / customer_inspection / third_party / metal_detect）
- 颜色规则：pass=true 绿、pass=false 红

### T12.03 提单号通知
- 触发：collection.afterUpdate on shipments
- 条件：bl_no 从空 → 非空
- 节点：sendEmail to customer.email，模板 `shipment-notification-<lang>`

### T12.04 状态推送
- 触发：collection.afterUpdate on shipments
- 条件：status 变更
- 节点：sendEmail 同模板，status 显示名通过 status_label 渲染

### T12.06 发货跟踪表
- 数据表：shipments
- 字段：shipment_no / order.order_no / customer.company_name / status / etd / eta / bl_no
- 排序：eta 升序
- 筛选：status NOT IN ('delivered')

## 目录结构

```text
plugin-nococrm-fulfillment/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # extendCollection + 6 hooks
│   │   └── collections/
│   │       ├── productionProgress.ts       # T11.01
│   │       ├── qcReports.ts                # T11.02 + T11.03
│   │       └── shipments.ts                # T12.01
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── assets/
│   └── email-templates/
│       ├── balance-invitation-zh/en/ja.html
│       └── shipment-notification-zh/en/ja.html
└── tests/
    └── m11-m12-e2e.md
```

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用报"必须先启用 plugin-nococrm-orders" | orders/production_plans 表未就绪 | 先启用 orders 插件 |
| cumulative_qty 总是 = 当日 completed_qty | 同一 plan 没有更早记录 | 设计如此（第一天的累计 = 当天完工） |
| qc.pass 但 order 没切到 completed | is_final_internal 未勾选 | 必须二者皆 true |
| 创建 shipment 报"未收到尾款" | balance_paid=false 且非 VIP | 财务先标记定金/尾款 payment.status=paid |
| status='shipped' 报"发货文件不齐" | invoice/packing_list/origin_cert 至少一个为空 | 上传三个文件后再切状态 |
| bl_no 录入后 atd 没自动填 | 写入时 atd 已有值 | hook 仅在 atd 为空时填，避免覆盖人工 |
| qc 推回 order 状态时报错 | order.status 已超过 completed（如已 shipped） | hook 设计了状态流过滤，不会回滚 |

## 升级路径

后续里程碑：
- M13 阶段 12 复盘与客户维护 → `@better-bags/plugin-nococrm-retro`
- M14 阶段 13 长期关系维护 → 同上或独立插件
- M15 ACL / M16 报表 / M17 验收上线 → 详见 tasks.md

## License

AGPL-3.0
