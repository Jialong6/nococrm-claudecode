# @better-bags/plugin-nococrm-core

Better Bags NocoCRM 核心插件 — **M1 基础数据架构** + **M2 阶段 1 客户获取与分类** 的可一键复现实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) 的 M1 + M2 把"在 NocoBase UI 里手点"的所有 collection、字段、字典数据、users 扩展，全部封装成一个标准 NocoBase 插件。

启用后：

- 7 张业务表全自动创建：`factories` / `product_categories` / `regions_dict` / `currencies_dict` / `lead_sources` / `customers` / `contacts`
- 内置 `users` 表自动加上 `employee_no` / `phone` / `region` / `job_title` / `is_active` 5 个字段
- 自动灌入 47 条基础字典数据（3 工厂 + 6 品类 + 20 地区 + 7 币种 + 11 来源）
- `customers.priority` 默认带 A/B/C/D 四级颜色 enum
- 字典表对所有登录用户开放读权限

剩下 5 个偏 UI 的任务（Dashboard / Kanban / 视图 / 工作流细节 / 端到端测试）见下方 **手动配置清单**。

## 启用步骤

```bash
# 1. 在项目根目录
cd project
yarn install

# 2. 启动 NocoBase
yarn dev

# 3. 浏览器进 http://localhost:13000 → 右上头像 → 插件管理
# 4. 找到 "NocoCRM 核心" → 点击启用
```

启用后访问"数据源 → main"应能看到 7 张新表。

## 已实现任务对照

| tasks.md 任务 | 实现位置 | 状态 |
|--------------|---------|------|
| T1.01 departments | 复用 NocoBase 官方 `plugin-departments`（已含同名表） | 复用 |
| T1.02 扩展 users | `src/server/plugin.ts` 的 `beforeLoad()` 用 `db.extendCollection()` | 已做 |
| T1.03 factories | `src/server/collections/factories.ts` + 3 条 seed | 已做 |
| T1.04 product_categories | `src/server/collections/productCategories.ts` + 6 条 seed | 已做 |
| T1.05a regions_dict | `src/server/collections/regionsDict.ts` + 20 条 seed | 已做 |
| T1.05b currencies_dict | `src/server/collections/currenciesDict.ts` + 7 条 seed | 已做 |
| T1.06 Dashboard 首页 | 见下方手动配置清单 | UI |
| T2.01 lead_sources | `src/server/collections/leadSources.ts` + 11 条 seed | 已做 |
| T2.02 customers | `src/server/collections/customers.ts`（30+ 字段） | 已做 |
| T2.03 contacts | `src/server/collections/contacts.ts` | 已做 |
| T2.04 priority 颜色映射 | `customers.ts` 的 priority enum 配置 | 已做 |
| T2.05 首响应工作流 | 见下方手动配置清单（导入 workflow JSON） | UI |
| T2.06 自动分级建议 | 见下方手动配置清单 | UI |
| T2.07 4 个客户视图 | 见下方手动配置清单 | UI |
| T2.08 客户 Kanban | 见下方手动配置清单 | UI |
| T2.09 自动回复模板 | `assets/email-templates/auto-reply-{zh,en,ja}.html` | 已做（需在通知管理导入）|
| T2.10 端到端测试 | `tests/m2-e2e.md` | 已做 |

## 业务红线（已在代码中落地）

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| 缅甸 MOQ ≥ 1500 件/款/色 | 03 知识库 | `product_categories.default_moq = 1500` |
| MM_YGN 工厂月产能 200000 件 | 02 知识库 | `factories` seed |
| CN_RZ 工厂 8000 ㎡/100 人/平车 120/电脑车 22 | 02 知识库 | `factories` seed |
| 客户分级 A/B/C/D 4 色 | CLAUDE.md | `customers.priority` enum |
| 11 种 lead source | SOP 阶段 1 | `lead_sources` seed |

## 手动配置清单（UI 操作）

启用插件后，进入 NocoBase UI 完成以下补充配置：

### T1.06 后台首页 Dashboard
路径：界面管理 → 桌面端 → 添加页面"首页"  
内容：
- 数据图表块 1：本月新增客户数（customers，按 created_at 过滤）
- 数据图表块 2：A 类客户数（customers，priority='A'）
- 数据图表块 3：在途订单数（orders.status ∈ {生产中, 已完成}，订单表见 M9）
- 数据图表块 4：本月发货量（shipments，见 M12）
- 数据图表块 5：未付尾款金额（payments.type='balance' AND status!='paid'）

### T2.07 4 个客户视图
路径：客户管理菜单 → customers 列表 → 视图管理 → 创建
1. **全部客户**：默认按 priority 升序
2. **A 类专属**：filter `priority = "A"`
3. **我的客户**：filter `owner.id = {{ currentUser.id }}`
4. **高风险**：filter `risk_flag = true`

### T2.08 客户 Kanban 看板
- 添加块 → 看板
- 分组字段：`status`
- 卡片字段：company_name + priority + owner + last_contact_at

### T2.05 / T2.06 工作流
路径：工作流管理 → 创建

**首响应工作流**：
- 触发器：collection.afterCreate on customers
- 节点 1：condition - 判断 `created_at` 是否在工作时间（周一至周五 9:00-18:00 北京时间）
- 节点 2A（工作时间）：create task → assignee=customer.owner, due=now+4h, title='首响应：{{ $context.data.company_name }}'
- 节点 2B（非工作时间）：sendEmail → template `auto_reply_<lang>`；delay 到次日 9:30 → create task

**自动分级建议**：
- 触发器：collection.afterCreate on customers
- 节点：javascript
  ```js
  const c = $context.data;
  let p = 'D';
  if (c.source && ['referral','customs_data'].includes(c.source.name_en)) p = 'B';
  else if (c.annual_volume_estimate >= 50000) p = 'B';
  else if (c.annual_volume_estimate >= 5000) p = 'C';
  return { priority: p, notes: '自动建议分级（可人工覆盖）' };
  ```
- 后续节点：update customers - 把 priority 写回去

### T2.09 邮件模板导入
路径：通知管理 → 邮件模板 → 创建 3 个模板
- 名称：`auto_reply_zh` / `auto_reply_en` / `auto_reply_ja`
- 复制 `assets/email-templates/auto-reply-*.html` 内容
- 变量映射：`{{customer.primary_contact}}` / `{{customer.company_name}}` / `{{user.nickname}}` / `{{user.email}}` / `{{user.job_title}}`

## 目录结构

```text
plugin-nococrm-core/
├── package.json
├── server.js / server.d.ts        # NocoBase 入口
├── client.js / client.d.ts
├── README.md                       # 本文件
├── src/
│   ├── index.ts
│   ├── client/
│   │   └── index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts               # 主插件类（含 users 扩展）
│   │   ├── collections/            # 7 个 collection
│   │   │   ├── factories.ts
│   │   │   ├── productCategories.ts
│   │   │   ├── regionsDict.ts
│   │   │   ├── currenciesDict.ts
│   │   │   ├── leadSources.ts
│   │   │   ├── customers.ts
│   │   │   └── contacts.ts
│   │   └── migrations/
│   │       └── 20260517000001-seed-base-dicts.ts
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── assets/
│   └── email-templates/
│       ├── auto-reply-zh.html
│       ├── auto-reply-en.html
│       └── auto-reply-ja.html
└── tests/
    └── m2-e2e.md
```

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用后看不到新表 | 没有跑 install/migrate | 终端跑 `yarn nocobase upgrade` 或重启 `yarn dev` |
| 字典是空的 | seed migration 未执行 | 检查日志看 `nococrm-core` namespace 是否报错；可以手动通过 UI "工具 → 升级" 触发 |
| customers.priority 颜色不显示 | NocoBase 客户端缓存 | 浏览器硬刷新 + 重新启用插件 |
| TypeScript 编译报错找不到 @nocobase/* | 没装依赖 | 在项目根 `yarn install` |
| 启用插件报 `Cannot find module 'dist/server/index.js'` | 没构建 | `yarn build` 或 `yarn workspace @better-bags/plugin-nococrm-core build` |

## 升级路径

后续里程碑（M3-M17）会以独立插件方式追加：
- `@better-bags/plugin-nococrm-meetings`（M3-M4 会议管理）
- `@better-bags/plugin-nococrm-quotation`（M5-M6 报价打样）
- `@better-bags/plugin-nococrm-orders`（M7-M12 订单生产发货）
- `@better-bags/plugin-nococrm-acl`（M15 权限矩阵）
- `@better-bags/plugin-nococrm-reports`（M16 报表）

避免把所有业务都塞进 core，便于按里程碑增量交付与独立启用。

## License

AGPL-3.0
