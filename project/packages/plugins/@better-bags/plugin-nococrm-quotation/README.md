# @better-bags/plugin-nococrm-quotation

Better Bags NocoCRM 询盘 → 核价 → 报价 → 打样 全链路插件 — **M5 阶段 4 跟进与报价** + **M6 阶段 5 报价与打样** 的可一键复现实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) 的 M5 + M6 共 **20 个任务**把"在 NocoBase UI 里手点"的询盘、核价、报价、样品 4 张表，以及 5 个 P0 业务红线工作流，全部封装成一个标准 NocoBase 插件。

启用后：

- 4 张业务表全自动创建：`inquiries` / `cost_estimates` / `quotations` / `samples`
- **6 个数据库 Hooks** 兑现业务红线（启用即生效，无需手动配置工作流）：
  1. T5.04 询盘 7 维评分 + status 自动切换（需求完善 ↔ 已交核价）
  2. T6.02 报价单 incoterms 默认按工厂国家（缅甸 → FOB Yangon / 中国 → FOB Qingdao）
  3. T6.03 新客户禁选 T/T 见提单（仅已成交+订单 ≥ 3 的 VIP 可选）
  4. T6.04 缅甸大货交期硬下限 90 天（来自 04 知识库）
  5. T6.05 工厂自动路由（数量 ≥ 1500 且非急单 → 缅甸；否则 → 山东日照）
  6. T6.06 单价低于建议价 → 报价状态锁回 draft + 写入待审批原因
  7. T6.07 样品自动默认值（计划完成 = 委托 + 7d / 打样工厂 = 青岛中心 / 客户从报价同步）
  8. T6.08 打样轮次 ≥ 4 → 客户自动标红高风险
- 6 份邮件模板（询盘跟进 + 样品跟进，各 3 语）
- 1 份 PDF 报价单模板（中英双语版式）

剩下偏 UI 的部分见下方 **手动配置清单**。

## 依赖

- 必须先启用 `@better-bags/plugin-nococrm-core`（customers / factories / product_categories / currencies_dict）
- 推荐启用：`plugin-kanban`、`plugin-workflow*`、`plugin-action-print`（PDF 输出）、`plugin-field-sequence`、`plugin-notification-email`、`plugin-snapshot-field`（报价版本快照）

## 启用步骤

```bash
cd project
yarn install
yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 询盘报价打样" → 启用
```

## 已实现任务对照

| tasks.md | 实现位置 | 状态 |
|----------|---------|------|
| T5.01 inquiries 表 | `collections/inquiries.ts`（19 字段，含 sequence 编号） | 已做 |
| T5.02 inquiries.status 字段 | 含在 T5.01 | 已做 |
| T5.03 24h 跟进邮件 | `assets/email-templates/inquiry-followup-{zh,en,ja}.html` + README 工作流指引 | 模板+UI |
| T5.04 完整度评分 | `plugin.ts` `inquiries.beforeSave` hook + `utils/completenessScore.ts` 纯函数 | 已做 |
| T5.05 cost_estimates 表 | `collections/costEstimates.ts`（含 field-formula margin） | 已做 |
| T5.06 核价 ACL | 仅 snippet 注册，字段级隔离留 M15 | 部分 |
| T5.07 询盘 Kanban | 见下方手动配置清单 | UI |
| T5.08 M5 e2e | `tests/m5-m6-e2e.md` 场景 1-6 | 已做 |
| T6.01 quotations 表 | `collections/quotations.ts`（18 字段） | 已做 |
| T6.02 incoterms 默认 | `plugin.ts` hook | 已做 |
| T6.03 payment_terms 校验 | `plugin.ts` hook（throw 阻断）| 已做 |
| T6.04 lead_time 下限 | `plugin.ts` hook（throw 阻断）| 已做 |
| T6.05 工厂路由 | `plugin.ts` hook | 已做 |
| T6.06 价格底线审批 | `plugin.ts` hook（status 锁回 draft）| 已做 |
| T6.07 samples 表 | `collections/samples.ts`（17 字段，beforeCreate 默认）| 已做 |
| T6.08 打样 ≥ 4 高风险 | `plugin.ts` `samples.afterSave` hook | 已做 |
| T6.09 首样无反馈跟进 | 邮件模板 + README 工作流 | 模板+UI |
| T6.10 报价 PDF | `assets/pdf-templates/quotation.html` | 已做 |
| T6.11 报价 / 样品 Kanban | 见下方手动配置清单 | UI |
| T6.12 M6 e2e | `tests/m5-m6-e2e.md` 场景 7-15 | 已做 |

## 业务红线对应（全部在代码中落地）

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| 缅甸 MOQ ≥ 1500（路由分水岭） | 03 知识库 | `quotations.beforeSave` 工厂路由 |
| 缅甸大货交期 ≥ 90 天 | 04 知识库 | `quotations.beforeSave` lead_time 硬校验 |
| 新客户 T/T 30/70（禁 tt_bl） | 06 知识库 | `quotations.beforeSave` payment_terms 校验 |
| 报价默认 FOB Yangon / Qingdao | 06 知识库 | `quotations.beforeSave` incoterms 默认 |
| 单价低于成本需上级审批 | 03 知识库 | `quotations.beforeSave` 价格底线 |
| 首样 1 周完成 | 05 知识库 | `samples.beforeCreate` planned_finish_at +7d |
| 打样 ≥ 4 次触发风险 | 05 知识库 | `samples.afterSave` risk_flag |
| 青岛打样中心默认 | 02 知识库 | `samples.beforeCreate` sampling_factory |

## 手动配置清单

### T5.03 24h 跟进邮件工作流
- 触发：collection.afterUpdate on meetings，条件 `status` 变成 completed
- 节点：delay 24h → sendEmail with template `inquiry-followup-<lang>`（按 customer.country 路由语言）→ update `customers.last_contact_at`
- 模板已就绪：`assets/email-templates/inquiry-followup-{zh,en,ja}.html`

### T5.07 询盘 Kanban
- 客户管理菜单 → 添加块 → 看板
- 数据表：inquiries
- 分组字段：status（5 列对齐 collecting / refining / costing / quoted / abandoned）
- 卡片字段：inquiry_no + customer.company_name + product_category + completeness_score
- 拖拽变更 status 会自动触发评分 hook 重算

### T6.09 首样无反馈跟进工作流
- 触发：定时任务（每天 9:00）
- 查询：samples filter `status = shipped` 且 `shipped_at <= now - 7d` 且 `customer_received_at IS NULL`
- 节点：sendEmail template `sample-followup-<lang>` + create task assignee=customer.owner
- 邮件模板已就绪

### T6.10 PDF 打印 action
- 启用 `plugin-action-print`
- 进入 quotations 列表/详情 → 添加 action → 类型 `print`
- 复制 `assets/pdf-templates/quotation.html` 内容到 action 的模板编辑器
- 变量：quotation.* / customer.* / inquiry.*
- 用户点击 action 时浏览器打开打印预览，可直接保存 PDF

### T6.11 报价 / 样品 Kanban
- **报价 Kanban**：分组 status（7 列：草稿 / 已发送 / 谈判中 / 已确认 / 已合同化 / 已过期 / 已废弃）
- **样品 Kanban**：分组 status（6 列：排队中 / 制作中 / 已寄出 / 已收到 / 已确认 / 已驳回）

### 财务字段隔离（T5.06 完整实现等 M15）
M15 之前的临时方案：管理员手动建 `finance` 角色，将 cost_estimates 表的 cost / margin 字段权限设为仅 finance / sales_manager 可见。详见 NocoBase 文档"字段权限"章节。

## 目录结构

```text
plugin-nococrm-quotation/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # 8+ db hooks
│   │   ├── collections/
│   │   │   ├── inquiries.ts                # T5.01 (19 字段)
│   │   │   ├── costEstimates.ts            # T5.05 (含 formula margin)
│   │   │   ├── quotations.ts               # T6.01 (18 字段)
│   │   │   └── samples.ts                  # T6.07 (17 字段)
│   │   └── utils/
│   │       └── completenessScore.ts        # T5.04 纯函数（可单测）
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── assets/
│   ├── email-templates/
│   │   ├── inquiry-followup-zh.html        # T5.03
│   │   ├── inquiry-followup-en.html
│   │   ├── inquiry-followup-ja.html
│   │   ├── sample-followup-zh.html         # T6.09
│   │   ├── sample-followup-en.html
│   │   └── sample-followup-ja.html
│   └── pdf-templates/
│       └── quotation.html                  # T6.10
└── tests/
    └── m5-m6-e2e.md
```

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用报"必须先启用 plugin-nococrm-core" | core 表（customers/factories）未就绪 | 先启用 core，再启用本插件 |
| inquiry 创建后 completeness_score 总是 0 | beforeSave hook 未触发 | 检查后端日志，看 `[nococrm-quotation] computeCompletenessScore failed` |
| quotation 抛错"缅甸大货交期不得短于 90 天" | T6.04 硬校验 | 这是业务红线，不可绕过；如确实需要短交期，请改路由 CN_RZ + 走急单逻辑 |
| quotation 抛错"T/T 见提单 仅 VIP" | T6.03 硬校验 | 客户须 status=closed 且 orders 表中订单 ≥ 3（orders 表 M9 引入）|
| 工厂路由没有自动填充 | factories 表里 CN_RZ / MM_YGN 缺失 | 检查 plugin-nococrm-core 的 seed 是否成功 |
| sample 创建后 customer.risk_flag 没标 | revision_no < 4 或 customer 已经 risk_flag=true | 设计如此（避免覆盖业务员手动标记） |
| margin_value 字段不计算 | 没启用 `plugin-field-formula` | 插件管理启用 |

## 升级路径

后续里程碑：
- M7 阶段 6 信任建立 → `@better-bags/plugin-nococrm-trust`（公司资料的 list block 已在 meetings 插件提供）
- M8 阶段 7 合同谈判 → `@better-bags/plugin-nococrm-negotiation`
- M9-M14 → 详见 tasks.md

## License

AGPL-3.0
