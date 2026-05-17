# @better-bags/plugin-nococrm-meetings

Better Bags NocoCRM 会议管理插件 — **M3 阶段 2 会议与沟通** + **M4 阶段 3 首次沟通会议** 的可一键复现实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) 的 M3 + M4 把"在 NocoBase UI 里手点"的会议主表、议程模板、会议纪要、销售资料库，全部封装成一个标准 NocoBase 插件。

启用后：

- 4 张业务表全自动创建：`meetings` / `meeting_agenda_templates` / `meeting_notes` / `company_assets`
- 自动灌入 15 条预置数据（5 议程模板 + 10 公司资料）
- 数据库 Hook 兜底两个关键逻辑：
  1. 创建会议时选了议程模板 → 自动复制模板内容到会议 agenda 字段
  2. 会议状态改为"已完成" → 自动回写 `customer.first_meeting_at` / `first_meeting_outcome` / `last_contact_at`（实现 T4.03 字段回写）

完整工作流（邮件提醒 / IT 通知 / 24h 跟进任务）见下方 **手动配置清单**。

## 依赖

- 必须先启用 `@better-bags/plugin-nococrm-core`（customers / users 等表的来源）
- 推荐启用 NocoBase 内置 `plugin-calendar`（会议日历视图）+ `plugin-workflow*`（工作流）+ `plugin-file-manager`（附件）+ `plugin-field-sequence`（自动编号）

## 启用步骤

```bash
cd project
yarn install
yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 会议与沟通" → 启用
```

## 已实现任务对照

| tasks.md 任务 | 实现位置 | 状态 |
|--------------|---------|------|
| T3.01 meetings 主表 | `src/server/collections/meetings.ts` | 已做 |
| T3.02 议程模板 | `src/server/collections/meetingAgendaTemplates.ts` + 5 条 seed + beforeCreate hook 自动填充 | 已做 |
| T3.03 会议日历视图 | 见下方手动配置清单 | UI |
| T3.04 24h/1h 提醒工作流 | 见下方手动配置清单 + 邮件模板 | UI |
| T3.05 工厂参观 IT 通知 | 见下方手动配置清单 | UI |
| T3.06 M3 测试清单 | `tests/m3-m4-e2e.md` | 已做 |
| T4.01 meeting_notes 纪要 | `src/server/collections/meetingNotes.ts` | 已做 |
| T4.02 销售资料 block | `src/server/collections/companyAssets.ts` + 10 条 seed | 已做 |
| T4.03 customer 字段回写 | plugin.ts `meetings.afterUpdate` hook | 已做 |
| T4.04 24h 跟进任务工作流 | 见下方手动配置清单（hook 已写 last_contact_at，工作流再补建任务） | UI |
| T4.05 M4 测试清单 | `tests/m3-m4-e2e.md` | 已做 |

## 业务红线对应

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| 工厂参观 = 视频参观需 IT 准备 | 02 知识库 | meetings.type 含 `tour_video` + README 工作流指引 |
| 议程含"工厂能力 + 客户需求确认" | 01 知识库 | 议程模板"初次介绍"与"需求确认" |
| 销售资料含 ISO 9001 + QC 流程 | 01/05 知识库 | company_assets seed |
| AQL 2.5 抽检 | 01 知识库 | 议程"工厂参观"的 QC 章节 + company_assets 中"AQL 2.5 抽检说明" |

## 手动配置清单（UI 操作）

启用插件后，进入 NocoBase UI 完成以下补充配置：

### T3.03 会议日历视图
- 路径：客户管理菜单 → 添加块 → 日历（需启用 `plugin-calendar`）
- 数据表：meetings
- 时间字段：scheduled_at
- 标题字段：meeting_no + customer.company_name
- 颜色字段：type
- 视图模式：月 / 周可切换

### T3.04 24h / 1h 自动提醒工作流
路径：工作流管理 → 创建定时触发流程

**工作流 A：24h 提醒**
- 触发：定时（每 30 分钟扫描一次）
- 查询：meetings filter `scheduled_at` 在 23h-25h 之间 且 `reminder_24h_sent = false` 且 `status ∈ {scheduled, confirmed}`
- 循环节点：每条记录
  - 节点 1：sendEmail to participants_external + participants_internal，模板 `meeting-reminder-<lang>`
  - 节点 2：sendInAppMessage 给内部参与人
  - 节点 3：update meetings.reminder_24h_sent = true

**工作流 B：1h 提醒**
- 同上，但筛选时间窗口 50min-70min，更新 reminder_1h_sent 字段

### T3.05 工厂参观 IT 准备通知
- 触发：collection.afterCreate on meetings
- 条件：type = `tour_video`
- 节点：
  - 创建任务：assignee = IT 部门负责人，due = scheduled_at - 1d，title = "[{{meeting.meeting_no}}] 测试视频/网络/Zoom"
  - 邮件通知 IT 群组

### T4.04 24h 跟进邮件任务
- 触发：collection.afterUpdate on meetings
- 条件：status 从非 completed 变为 completed
- 节点：
  - 创建任务：assignee = customer.owner，due = now + 24h，title = "[{{customer.company_name}}] 会后跟进邮件"
- 说明：插件 hook 已自动写回 customer.first_meeting_at / outcome / last_contact_at；本工作流仅补建跟进任务。

### T4.02 销售资料 block（在会议详情页右侧）
- 进入 meeting 详情页
- 添加块 → 列表块
- 数据表：company_assets
- 筛选：`is_public = true`
- 分组：asset_type
- 字段：title / description / file / external_url
- 操作：下载 / 复制链接

## 目录结构

```text
plugin-nococrm-meetings/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                # 含 2 个 db.on hooks
│   │   ├── collections/
│   │   │   ├── meetings.ts
│   │   │   ├── meetingAgendaTemplates.ts
│   │   │   ├── meetingNotes.ts
│   │   │   └── companyAssets.ts
│   │   └── migrations/
│   │       └── 20260518000001-seed-agendas-and-assets.ts
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── assets/
│   └── email-templates/
│       ├── meeting-reminder-zh.html
│       ├── meeting-reminder-en.html
│       └── meeting-reminder-ja.html
└── tests/
    └── m3-m4-e2e.md
```

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用后看不到表 | 没有跑 install/migrate | `yarn nocobase upgrade` 或重启 `yarn dev` |
| 议程模板为空 | seed 未执行 | UI 触发"工具 → 升级"；或检查日志 `nococrm-meetings` namespace |
| 选模板后议程没自动填充 | beforeCreate hook 未触发 | 确认 agenda 字段为空时才会复制（避免覆盖手填内容）|
| 会议完成 customer 没回写 | afterUpdate hook 失败 | 检查 customer_id 是否正确关联；看后端日志 |
| meeting_no 没自动生成 | 没启用 `plugin-field-sequence` | 插件管理 → 启用 |

## 升级路径

后续里程碑：
- M5 阶段 4 跟进与报价 → `@better-bags/plugin-nococrm-followup`
- M6 阶段 5 报价与打样 → `@better-bags/plugin-nococrm-quotation`
- M7-M14 → 详见 tasks.md

## License

AGPL-3.0
