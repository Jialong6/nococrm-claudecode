# @better-bags/plugin-nococrm-followup

Better Bags NocoCRM 跟进与谈判插件 — **M7 阶段 6 信任建立与跟进** + **M8 阶段 7 合同谈判** 的可一键复现实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) 的 M7 + M8 共 **11 个任务**把"在 NocoBase UI 里手点"的跟进话术、谈判记录、谈判止损告警，全部封装成一个标准 NocoBase 插件。

启用后：

- 3 张业务表自动创建：`followup_scripts` / `negotiations` / `negotiation_scripts`
- `quotations` 表自动扩展一个 `followup_due_at` 字段（M5/M6 quotations 表的延伸）
- **3 个数据库 Hooks**：
  1. T7.02 quotation.status → sent 时自动计算 `followup_due_at = sent_at + 14d`
  2. T8.01 negotiation 创建时 customer / round_no / occurred_at 自动同步
  3. T8.03 谈判轮次 ≥ 5 → 自动写 `quotations.pending_approval_reason` 标记止损评估
- **24 条话术 seed**：
  - 12 条 followup_scripts（决策进展询问 / 提供新案例 / 技术补充 / 节日问候 × 中英日）
  - 12 条 negotiation_scripts（价格 / 交期 / 付款 / MOQ 异议应对 × 中英日）

T7.01 `company_assets` 由 `plugin-nococrm-meetings` 已提供（M4 已实施），本插件不重建。

## 依赖

- 必须先启用 `@better-bags/plugin-nococrm-core`（customers / factories）
- 必须先启用 `@better-bags/plugin-nococrm-quotation`（quotations / cost_estimates）
- 推荐启用：`plugin-workflow*`（定时工作流）、`plugin-notification-email`、`plugin-block-list`（谈判时间线视图）
- 建议同步启用 `plugin-nococrm-meetings` 以获得 company_assets

## 启用步骤

```bash
cd project
yarn install
yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 跟进与谈判" → 启用
```

## 已实现任务对照

| tasks.md | 实现位置 | 状态 |
|----------|---------|------|
| T7.01 company_assets | 复用 plugin-nococrm-meetings（已实施）| 复用 |
| T7.02 14 天未决策跟进 | `quotations.followup_due_at` 扩展字段 + `plugin.ts` afterUpdate hook + README 定时工作流 | 已做 |
| T7.03 30 天无联系提醒 | 见下方手动配置清单（plugin-workflow-schedule）| UI |
| T7.04 跟进话术模板 | `collections/followupScripts.ts` + 12 条 seed | 已做 |
| T7.05 M7 e2e | `tests/m7-m8-e2e.md` 场景 1-4 | 已做 |
| T8.01 negotiations 表 | `collections/negotiations.ts` + beforeCreate hook 自动同步 | 已做 |
| T8.02 让步追踪字段 | `negotiations.concession_discount_pct`（含在 T8.01）| 已做 |
| T8.03 谈判止损 | `plugin.ts` `negotiations.afterSave` hook（写 quotation.pending_approval_reason）| 已做 |
| T8.04 谈判时间线视图 | 见下方手动配置清单（plugin-block-list 按 round_no 升序）| UI |
| T8.05 谈判应对话术库 | `collections/negotiationScripts.ts` + 12 条 seed | 已做 |
| T8.06 M8 e2e | `tests/m7-m8-e2e.md` 场景 5-9 | 已做 |

## 业务红线对应

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| 14 天未决策需主动跟进 | SOP 阶段 6 | `quotations.followup_due_at` hook + README 定时 |
| 30 天无联系需提醒 | SOP 阶段 6 | README 定时工作流 |
| 谈判 ≥ 5 轮触发止损评估 | SOP 阶段 7 | `negotiations.afterSave` hook |
| 价格红线（不接亏本订单）| 03 知识库 | negotiation_scripts 价格异议话术内置 |
| 缅甸大货交期 90 天 | 04 知识库 | negotiation_scripts 交期异议话术内置 |
| 新客户 T/T 30/70 | 06 知识库 | negotiation_scripts 付款异议话术内置 |
| 缅甸 MOQ 1500 | 03 知识库 | negotiation_scripts MOQ 异议话术内置 |

## 手动配置清单

### T7.02 14 天未决策定时工作流
路径：工作流管理 → 创建定时触发流程

- 触发：每天 9:00 北京时间
- 查询：`quotations` filter `followup_due_at <= today AND status = 'sent' AND customer.status NOT IN ('ordered','closed','lost')`
- 循环节点：每条记录
  - 节点 1：创建任务 → assignee = customer.owner，due = today + 1d，title = "[{{quotation.quotation_no}}] 14 天未决策，请安排跟进"
  - 节点 2：sendEmail 给业务员，正文提示选用 followup_scripts 模板（scenario=decision_check）
  - 节点 3：update quotations.followup_due_at = today + 14d（避免无限重复触发）

### T7.03 30 天无联系定时工作流
- 触发：每天 9:00
- 查询：`customers` filter `priority IN ('A','B','C') AND last_contact_at < now - 30d AND status NOT IN ('closed','lost','ordered')`
- 节点：创建任务给 customer.owner，title = "[{{customer.company_name}}] 30 天无联系，请主动跟进"
- 提示：可下拉 followup_scripts 选 greeting 或 new_case 模板

### T8.04 谈判时间线视图（在 quotation 详情页）
- 进入 quotation 详情
- 添加列表块（plugin-block-list）
- 数据表：negotiations
- 筛选：`quotation_id = currentRecord.id`
- 排序：round_no 升序
- 字段：round_no / occurred_at / customer_concerns / our_response / concession_value / concession_discount_pct / outcome

### 业务员日常使用 followup_scripts
- 写邮件时，从 followup_scripts 列表下拉选模板
- 复制 body 到邮件正文
- 通知工作流自动渲染 {{customer.*}} / {{user.*}} / {{quotation.*}} 变量

### 累计让步统计（T8.02 衍生）
quotation 详情页添加图表块：
- 数据：negotiations filter by quotation_id
- 聚合：sum(concession_discount_pct)
- 一眼看出本报价累计让出多少折扣，避免业务员"小步快跑"地超出底线

## 目录结构

```text
plugin-nococrm-followup/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # extendCollection + 3 hooks
│   │   ├── collections/
│   │   │   ├── followupScripts.ts          # T7.04
│   │   │   ├── negotiations.ts             # T8.01 + T8.02
│   │   │   └── negotiationScripts.ts       # T8.05
│   │   └── migrations/
│   │       └── 20260520000001-seed-scripts.ts  # 24 条话术
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
└── tests/
    └── m7-m8-e2e.md
```

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用报"必须先启用 plugin-nococrm-quotation" | quotations 表未就绪 | 先启用 quotation，再启用本插件 |
| quotations 字段里没看到 followup_due_at | beforeLoad extendCollection 未生效 | 重启 `yarn dev` |
| status=sent 但 followup_due_at 没填 | hook 静默失败 | 查后端日志 `[nococrm-followup]` 前缀错误 |
| 谈判记录创建后 round_no 没自动递增 | 同一 quotation_id 已存在历史轮次但被禁用了 | hook 取 max(round_no)；若全部被删则从 1 开始 |
| 谈判 5 轮后 quotation 没标止损 | 已经标过 | 幂等检查，已有 STUCK_FLAG_MARKER 不重复写 |
| 话术 seed 没灌入 | migrations 未执行 | UI "工具 → 升级" 触发；或检查 `nococrm-followup` namespace 日志 |

## 升级路径

后续里程碑：
- M9 阶段 8 订单确认 → `@better-bags/plugin-nococrm-orders`
- M10 阶段 9 生产准备 → `@better-bags/plugin-nococrm-production`
- M11-M14 → 详见 tasks.md

## License

AGPL-3.0
