# @better-bags/plugin-nococrm-orders

Better Bags NocoCRM 订单与生产准备插件 — **M9 阶段 8 订单确认** + **M10 阶段 9 生产准备** 的可一键复现实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) 的 M9 + M10 共 **15 个任务**把"在 NocoBase UI 里手点"的合同、订单、付款、物料、排产 5 张主表，以及 5 个 P0 自动化工作流，全部封装成一个标准 NocoBase 插件。

启用后：

- 5 张业务表自动创建：`contracts` / `orders` / `payments` / `materials` / `production_plans`
- **6 个数据库 Hooks** 兑现关键自动化（启用即生效）：
  1. T9.01 contracts.beforeCreate：从 quotation 自动同步 customer / 金额 / 币种 / incoterms / payment_terms
  2. **T9.04 contracts.afterUpdate**：status → signed 时自动创建 order + 30% 定金 payment + customer.status='ordered'（幂等）
  3. T9.02 orders.beforeCreate：从 contract 兜底同步 customer
  4. T9.02 orders.beforeSave：缅甸 MOQ < 1500 → throw；缅甸交期 < pp + 90 天 → throw
  5. **T9.05 payments.afterUpdate**：定金 paid → order 解锁 + 自动建尾款（70%）+ 自动建排产记录；尾款 paid → order.balance_paid=true
  6. materials.beforeCreate：order_id 必填校验
- **3 个 formula 字段**（materials 表，来自 04 知识库 14+7+14 时间轴）：
  - `expected_dongguan_arrival = po_date + 14d`
  - `expected_qc_pass = po_date + 21d`
  - `expected_factory_arrival = po_date + 35d`

启用本插件后，M5/M6 quotation 的 T6.03 hook（新客户禁选 tt_bl 依赖 orders.count）将完整生效。

## 依赖

- 必须先启用 `@better-bags/plugin-nococrm-core`（customers / factories / currencies_dict）
- 必须先启用 `@better-bags/plugin-nococrm-quotation`（quotations / inquiries）
- 推荐启用：`plugin-kanban`、`plugin-gantt`、`plugin-workflow*`、`plugin-field-sequence`、`plugin-field-formula`

## 启用步骤

```bash
cd project
yarn install
yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 订单与生产准备" → 启用
```

## 已实现任务对照

| tasks.md | 实现位置 | 状态 |
|----------|---------|------|
| T9.01 contracts 表 | `collections/contracts.ts` + beforeCreate 同步 | 已做 |
| T9.02 orders 表（9 状态机）| `collections/orders.ts` + beforeSave 红线校验 | 已做 |
| T9.03 payments 表 | `collections/payments.ts` | 已做 |
| T9.04 contract → order+deposit | `plugin.ts` `contracts.afterUpdate` hook（幂等）| 已做 |
| T9.05 deposit paid → 排产+尾款 | `plugin.ts` `payments.afterUpdate` hook（幂等）| 已做 |
| T9.06 订单/付款看板 | 见下方手动配置清单 | UI |
| T9.07 财务字段权限 | snippet 注册（字段级留 M15）| 部分 |
| T9.08 M9 e2e | tests/m9-m10-e2e.md 场景 1-7 | 已做 |
| T10.01 materials 表 | `collections/materials.ts`（14 字段 + 3 formula）| 已做 |
| T10.02 production_plans 表 | `collections/productionPlans.ts`（5 个里程碑）| 已做 |
| T10.03 物料齐套自动计算 | formula 字段（含在 T10.01）| 已做 |
| T10.04 物料逾期告警 | 见下方手动配置清单（plugin-workflow-schedule）| UI |
| T10.05 排产 -3d 通知质检 | 见下方手动配置清单 | UI |
| T10.06 排产甘特图 | 见下方手动配置清单（plugin-gantt）| UI |
| T10.07 M10 e2e | tests/m9-m10-e2e.md 场景 8-12 | 已做 |

## 业务红线对应

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| T/T 30% 定金 + 70% 尾款 | 06 知识库 | `payments` percentage 字段；hook 自动建定金/尾款记录 |
| 定金 7 天内到账 | 06 知识库 | hook 设置 deposit.due_date = signed_at + 7 |
| 尾款发货前付清 | 06 知识库 | hook 设置 balance.due_date = committed_delivery - 7 |
| 缅甸 MOQ ≥ 1500 | 03 知识库 | `orders.beforeSave` throw |
| 缅甸交期 ≥ 90 天 | 04 知识库 | `orders.beforeSave` throw |
| 物料东莞 14d + 验货 7d + 海运 14d | 04 知识库 | materials 3 个 formula 字段 |
| AQL 2.5 + X 线检针 | 01/02 知识库 | production_plans.milestone_metal_detect 字段 |

## 手动配置清单

### T9.06 订单看板（9 列）
- 路径：客户管理菜单 → 添加块 → 看板
- 数据表：orders
- 分组：status（9 列：deposit_pending → production_pending → in_production → qc_pending → completed → shipping_pending → shipped → delivered，独立 cancelled 列）
- 卡片字段：order_no / customer.company_name / quantity / committed_delivery / production_factory.name

### T9.06 付款看板/列表
- 数据表：payments
- 表格视图 + 按 type 筛选（定金/尾款/其他）+ 按 status 筛选
- 颜色规则：unpaid 默认 / partial 黄 / paid 绿 / overdue 红

### T9.07 财务角色（M15 之前的临时方案）
- ACL → 创建角色 `finance`
- 限定 payments 表：finance 可读写所有字段；其他角色仅 list/get（不能 create/update）
- M15 引入完整 finance 角色后本步骤自动接管

### T10.04 物料逾期定时工作流
- 触发：定时（每天 9:00 北京时间）
- 查询：`materials` filter `actual_dg_arrival IS NULL AND supplier_eta_dg < today`
- 节点：循环 → 创建任务给采购部 → 邮件提醒供应商

### T10.05 排产 -3d 通知质检
- 触发：定时（每天 9:00）
- 查询：`production_plans` filter `status = 'pending' AND planned_start = today + 3d`
- 节点：通知 QC 团队（特殊要求来自 special_requirements 字段）

### T10.06 排产甘特图
- 启用 `plugin-gantt`
- 数据表：production_plans
- 时间字段：planned_start / planned_end（实际开工/完工双轨展示需 plugin-gantt 高级配置）
- 按 factory 分组

## 目录结构

```text
plugin-nococrm-orders/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # 6+ db hooks
│   │   └── collections/
│   │       ├── contracts.ts                # T9.01
│   │       ├── orders.ts                   # T9.02（9 状态机）
│   │       ├── payments.ts                 # T9.03
│   │       ├── materials.ts                # T10.01 + 3 formula
│   │       └── productionPlans.ts          # T10.02（5 里程碑）
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
└── tests/
    └── m9-m10-e2e.md
```

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用报"必须先启用 plugin-nococrm-quotation" | quotations 表未就绪 | 先启用 quotation，再启用本插件 |
| contracts.status → signed 后没自动建 order | hook 静默失败 | 查后端日志 `[nococrm-orders]` 前缀错误 |
| order 重复创建 | 幂等检查失败 | hook 已检查 contract_id；若仍重复请清掉 orders 记录重试 |
| 定金 paid 但 order 没解锁 | 也许 payment.type ≠ 'deposit' | 检查 type 是否正好为 'deposit'（不是 'tt_30_70'）|
| materials formula 字段为空 | po_date 未填 | formula 依赖 po_date；先填 po_date |
| materials 3 个 formula 字段不动 | 未启用 plugin-field-formula | 插件管理启用 |
| orders 抛错 "缅甸 MOQ 不得低于 1500" | T9.02 业务红线 | 改路由到 CN_RZ 或将 quantity 提到 1500+ |

## 升级路径

后续里程碑：
- M11 阶段 10 生产与质检 → `@better-bags/plugin-nococrm-production-qc`
- M12 阶段 11 发货交付 → `@better-bags/plugin-nococrm-shipping`
- M13-M14 → 详见 tasks.md

## License

AGPL-3.0
