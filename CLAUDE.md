# NocoCRM - 项目指南

基于 **NocoBase 开源 no-code 平台** 为 **Better Bags Myanmar / 中缅双工厂箱包 OEM 业务** 量身搭建的 CRM 系统的官方 CLAUDE.md。

## 项目概览 (Project Overview)

**NocoCRM** 是一套用 NocoBase 配置出来的 OEM 客户管理系统，承载 Better Bags 完整的客户转化流程：

- 完整复刻 13 阶段客户转化 SOP（从询盘到长期维护）
- 支持 A/B/C/D 四级客户分类与差异化响应
- 双工厂订单路由：中国山东 (日照/青岛) + 缅甸仰光 (NGWE PIN LAI)
- 中文界面，业务面向日本市场为主
- 业务覆盖：询盘 → 打样 → 报价 → 谈判 → 订单 → 生产 → 质检 → 发货 → 复盘 → 复购

**核心定位**：**这是一个 no-code 配置项目，不是代码开发项目**。所有 CRM 功能通过 NocoBase 内置 UI 完成（Collection 设计、视图搭建、工作流编排、权限配置），原则上不修改 NocoBase 源码。

**技术底座**：NocoBase (Node.js ≥18, PostgreSQL/MySQL/MariaDB/Kingbase, TypeScript 5, React 18, Antd, Formily) + 105 个内置插件。

## 核心规则 (Critical Rules)

### 1. 配置优先，禁止改源码 (MANDATORY)

- **第一选择是 NocoBase UI 配置**（Collection、Field、Workflow、ACL、View）
- 第二选择是启用现成插件（`project/packages/plugins/@nocobase/` 105 个）
- **改源码必须先讨论**，且优先以插件形式扩展
- `project/` 目录是 NocoBase 源码——视为只读

### 2. 业务参数以 6 份知识库为准 (ENFORCED)

所有业务数字、阈值、条款必须查 `01-06` 这 6 份 md，**严禁凭空设定**。这些是工厂经营的硬性约束，写入 CRM 后直接影响接单决策。

### 3. A/B/C/D 客户分级是 CRM 主线 (NON-NEGOTIABLE)

- 所有客户视图、看板、通知规则、跟进任务，都必须支持 A/B/C/D 维度
- 分级标准来自 SOP 流程图，不可简化为"重要/一般"二分类

### 4. 命名规范

- **Collection / Field key**：snake_case 英文（如 `customers`、`priority`、`pp_sample_date`）
- **显示名 / 菜单 / 选项 label**：中文（如"客户等级"、"待跟进"）
- **状态字段**：单选 + 中文 label
- **金额字段**：number + 货币代码 + 保留 2 位小数

### 5. 数据安全

- 改 Collection schema 前先用 `plugin-backup-restore` 备份
- 启用 `plugin-audit-logs` 记录所有状态变更
- 客户联系方式、合同金额属于敏感数据，按部门级 ACL 隔离

## 业务知识库 (必读)

根目录下 6 份 md 是业务真相之源，配置 CRM 前必须熟读：

| 文件 | 内容 | 在 CRM 里的应用 |
|------|------|----------------|
| `01-公司概况与核心优势.md` | 成立 2003 年、20+ 年 OEM 经验、日本市场为主 | 公司介绍模板（销售资料 block） |
| `02-工厂硬件与设备产能.md` | 山东日照 8000㎡/100 人、缅甸仰光 370 人 | 产能字段（订单可承接评估） |
| `03-产品线与接单策略.md` | **缅甸 MOQ 1500 件/款/色**、急单 30 天 | 订单路由规则（山东 vs 缅甸） |
| `04-供应链与交期管理.md` | **大货交期 3 个月**（PP 起算）+ 物料 1 月 | 自动交期计算 |
| `05-研发打样与确认流.md` | 首样 1 周、**4 次以上视为高风险** | 打样轮次告警工作流 |
| `06-商务条款与报价规范.md` | **FOB Yangon/Qingdao**、**T/T 30/70**、L/C 支持 | 报价模板默认值 |

## 13 阶段 SOP (CRM 主流程)

每个阶段对应 NocoBase 里若干 collection + status + workflow + view：

| # | 阶段 | NocoBase 实现 |
|---|------|--------------|
| 1 | 客户获取与分类 | `customers` + `lead_source` 字段 + 自动回复 workflow + A/B/C/D 分级 |
| 2 | 会议与沟通 | `meetings` + 日程同步 + 议程模板 |
| 3 | 首次沟通会议 | `meetings.notes` + 销售资料 block |
| 4 | 会后跟进与报价 | `inquiries` + 24h 跟进定时任务 + 需求确认表 |
| 5 | 报价与打样 | `quotations` + `samples` + 打样轮次计数（≥4 触发告警） |
| 6 | 信任建立与跟进 | `follow_ups` + 1-2 周提醒 workflow |
| 7 | 合同谈判 | `negotiations` 子记录 + 让步追踪 |
| 8 | 订单确认 | `orders` + 30% 定金状态机 + PO 上传 |
| 9 | 生产准备 | 关联 `factories` + 排产里程碑 |
| 10 | 生产与质检 | `qc_reports` + AQL 2.5 抽检字段 + 进度照片 |
| 11 | 发货交付 | `shipments` + 提单号 + 70% 尾款触发器 |
| 12 | 复盘与维护 | 满意度评分 + 客户状态 → "已成交" + 内部复盘记录 |
| 13 | 长期关系维护 | 季度回访任务自动生成 + 复购循环回流至阶段 1 |

## 客户分级 A/B/C/D

| 等级 | 定义 | 响应时效 | 视图标识 |
|------|------|---------|---------|
| **A 类** | 现有客户 / VIP | 几小时内 | 颜色 #2e7d32（绿），视图自动置顶 |
| **B 类** | 重要新客户（明确需求） | 当天 | 颜色 #ef6c00（橙） |
| **C 类** | 一般潜客（需培养） | 3 天内 | 颜色 #7b1fa2（紫），进入培养循环 |
| **D 类** | 低意向 | 邮件列表 + 季度群发 | 颜色 #546e7a（灰） |

**配置位置**：`customers.priority` 单选字段 → 看板按 priority 分组 → 条件颜色规则 → 通知模板按等级派发。

## NocoBase 配置规范

### Collection 设计

- 每个 collection 必带：`created_at`、`updated_at`、`created_by`、`updated_by`、`tenant_id`（多工厂场景）
- 关系字段优先 m2o / o2m，避免不必要的 m2m
- 状态字段统一用单选 + 中文 label（如：`待跟进`/`已报价`/`已下单`/`已发货`/`已成交`/`已流失`）
- 启用 `plugin-snapshot-field` 保留报价单等关键历史快照

### 视图设计

- 13 阶段 SOP 各起一个 Kanban view，按 stage 分列
- 客户主表必备 4 个 view：全部客户 / A 类专属 / 我的客户 / 高风险客户
- 报表用 `plugin-data-visualization-echarts` 出转化漏斗、阶段停留时长

### 权限 (ACL)

- 业务员只能看到自己负责的客户
- 销售经理可看本部门所有
- 财务只能看金额相关字段，看不到客户联系方式
- 工厂只看排产/QC 相关 collection

## 关键插件清单（要启用）

来自 `project/packages/plugins/@nocobase/`：

**数据层**
- `plugin-data-source-main`、`plugin-collection-tree`、`plugin-snapshot-field`、`plugin-field-formula`

**视图层**
- `plugin-kanban`（13 阶段看板）、`plugin-calendar`（会议/打样日历）、`plugin-gantt`（生产排期）、`plugin-block-grid-card`

**工作流**
- `plugin-workflow`、`plugin-workflow-action-trigger`、`plugin-workflow-delay`、`plugin-workflow-loop`、`plugin-workflow-mailer`、`plugin-workflow-notification`

**通知**
- `plugin-notification-email`、`plugin-notification-in-app-message`、`plugin-notification-manager`

**文件 / 附件**
- `plugin-file-manager`、`plugin-file-previewer-office`（PI、合同、PO 预览）

**报表 / AI**
- `plugin-charts`、`plugin-data-visualization-echarts`、`plugin-ai`（后续接入 AI employee 评估客户分级）

**安全 / 协作**
- `plugin-acl`、`plugin-auth`、`plugin-audit-logs`、`plugin-api-keys`、`plugin-comments`、`plugin-departments`

**运维**
- `plugin-backup-restore`、`plugin-error-handler`、`plugin-logger`

## 目录结构

```text
nocoCRM-ClaudeCode/
├── CLAUDE.md                    # 本文件：项目总指南
├── 01-公司概况与核心优势.md      # 业务知识库（6 份）
├── 02-工厂硬件与设备产能.md
├── 03-产品线与接单策略.md
├── 04-供应链与交期管理.md
├── 05-研发打样与确认流.md
├── 06-商务条款与报价规范.md
├── project/                     # NocoBase 源码（视为只读）
│   ├── packages/
│   │   ├── core/                # @nocobase 核心
│   │   ├── plugins/@nocobase/   # 105 个内置插件
│   │   └── presets/             # 预置插件包
│   ├── storage/                 # 运行时数据（备份、上传）
│   ├── docker/                  # 容器编排
│   └── .env.example
├── commands/                    # slash command（/plan、/tdd 等 15 个）
├── rules/                       # 编码与协作规范（8 份）
├── skills/                      # 可复用 skill（9 个）
├── subagents/                   # 专项 subagent（9 个）
└── hooks/                       # git hooks 与 Claude hooks
```

## 关键模式 (Key Patterns)

### 订单路由规则（山东 vs 缅甸）

```text
IF 数量 < 1500 OR 急单 OR 多款并行打样
   → 路由到 山东日照工厂
   → 报价 FOB Qingdao
   → 最快交期 30 天

IF 数量 ≥ 1500 单款单色 AND 非急单
   → 路由到 缅甸仰光工厂
   → 报价 FOB Yangon
   → 标准交期 3 个月 (PP 确认起算)
```

### 交期自动计算

```text
预计交期 = max(
  PP_sample_确认日 + 90 天,
  物料齐套日 + 排产等待 + 生产天数
)

物料齐套 = 物料下单 + 供应商生产 2 周 + 国内验货 1 周 + 海运清关 2 周
```

### 打样轮次告警

```text
samples.revision_count >= 4
  → customers.risk_flag = "高风险"
  → 触发 workflow：通知销售经理评估是否拒绝继续打样
  → 看板自动标红
```

### 付款节点状态机

```text
新客户：
  draft → confirmed (合同签署) → deposit_paid (30%) →
  in_production → qc_passed → balance_paid (70%) → shipped → delivered

VIP/老客户：
  draft → confirmed → in_production → qc_passed → shipped →
  delivered → invoice_issued → paid_within_1w (T/T 见提单)
```

## 环境变量

```bash
# NocoBase 应用
APP_ENV=development              # development | production
APP_PORT=13000
APP_KEY=                         # 必填，强随机字符串

# 数据库（生产建议 postgres）
DB_DIALECT=postgres
DB_HOST=
DB_PORT=
DB_DATABASE=nocobase
DB_USER=
DB_PASSWORD=

# 邮件（客户通知工作流）
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# 文件存储
LOCAL_STORAGE_BASE_URL=          # 或 S3 配置

# 日志
LOGGER_TRANSPORT=console         # console | file | dailyRotateFile
LOGGER_LEVEL=info
```

**注意**：永远不要提交 `.env`；用 `project/.env.example` 作为模板。

## 可用命令 (commands/)

定义在 `commands/`，通过 `/command-name` 调用：

**规划与协作**
- `/plan` - 新功能/新 collection 设计前先用这个
- `/orchestrate` - 多 agent 并行任务编排
- `/setup-pm` - 项目管理初始化

**配置审查**
- `/code-review` - 审 collection schema、ACL、字段命名
- `/checkpoint` - 配置快照前的全面检查
- `/verify` - 配置正确性验证

**测试与运维**
- `/tdd` - 数据校验规则与工作流测试
- `/e2e` - Playwright 端到端走一遍 13 阶段流程
- `/test-coverage` - 工作流覆盖率
- `/build-fix` - NocoBase 构建报错处理

**维护**
- `/refactor-clean` - 清理废弃字段/视图
- `/update-docs` - 同步更新业务文档
- `/update-codemaps` - 更新 collection 关系图
- `/eval` / `/learn` - 评估与学习反馈

## Subagents (subagents/)

9 个专项 agent，no-code 项目最常用：

- **planner** - 设计数据模型与 collection 关系（用于阶段 1-13 任意阶段建模）
- **architect** - 多 collection 联动与全局视图架构
- **code-reviewer** - 审 schema、字段命名、视图配置
- **security-reviewer** - 审 ACL、API key、敏感字段隔离
- **doc-updater** - 业务变更后同步 6 份知识库
- **build-error-resolver** - NocoBase 升级/插件冲突排查
- **e2e-runner** - 完整业务流程演练
- **refactor-cleaner** - 历史废弃字段/工作流清理
- **tdd-guide** - 自定义工作流脚本时使用

## Skills (skills/)

可复用最佳实践：

- **coding-standards** - TypeScript/React 规范（自定义插件时使用）
- **frontend-patterns** - Antd / Formily 模式
- **security-review** - 安全检查清单
- **tdd-workflow** - 测试驱动开发
- **verification-loop** - 验证循环
- **continuous-learning** - 持续学习反馈
- **strategic-compact** - 上下文压缩策略
- **eval-harness** - 评估框架
- **project-guidelines-example** - 项目规范示例

## 配置工作流 (Setup Workflow)

按 13 阶段 SOP 增量配置，每阶段闭环后再做下一阶段。

1. **设计**：用 `/plan` 出 collection 设计文档（字段、关系、状态机、ACL）
2. **配置**：在 NocoBase UI 完成 collection / view / workflow 搭建
3. **导出备份**：用 `plugin-backup-restore` 导出当前配置快照到 `project/storage/backups/`
4. **造数据**：用 `plugin-mock-collections` 生成测试数据走通流程
5. **审查**：用 `/code-review` 检查命名、ACL、敏感字段
6. **演练**：用 `/e2e` 走通完整客户旅程
7. **提交**：把配置快照纳入版本管理

## 业务红线 (Non-Negotiable)

来自 6 份业务知识库的硬性约束，CRM 配置中必须以表单校验/工作流强制执行：

- **缅甸大货 MOQ ≥ 1500 件/款/色** — `orders` 创建时强校验
- **新客户付款条款 = T/T 30% 定金 + 70% 尾款** — `quotations` 默认值且不可改
- **大货交期 ≥ 3 个月**（PP Sample 确认起算）— 不允许选更短交期
- **打样轮次 ≥ 4 次自动标红**（高风险客户）— 触发评估工作流
- **报价默认 FOB**：缅甸 → FOB Yangon，国内 → FOB Qingdao — 模板锁定
- **价格红线**：单价不得低于成本线 — 超出需销售经理审批
- **不接明显压价亏本订单** — 报价审批节点拦截

## 快速参考 (Quick Reference)

```bash
# 安装与启动（首次）
cd project
yarn install
cp .env.example .env             # 然后填写 DB / SMTP / APP_KEY
yarn nocobase install
yarn dev                         # http://localhost:13000

# 日常
yarn start                       # 生产模式启动
yarn nocobase backup             # 配置备份
yarn nocobase restore <file>     # 配置还原
yarn nocobase upgrade            # 版本升级（先备份！）

# Docker
docker compose up -d             # 完整环境

# 常用 slash command
/plan                            # 设计新 collection
/code-review                     # 审 schema
/e2e                             # 走通 13 阶段
/checkpoint                      # 上线前最终检查
```

## 重要提示 (Important Notes)

- **13 阶段流程图是 CRM 设计的圣经** — 所有视图、看板、工作流围绕它展开
- **A/B/C/D 分级是产品的灵魂** — 不要简化为二元分类
- **6 份业务知识库的数字是硬约束** — 不要"差不多就行"，那是工厂经营的红线
- **NocoBase 升级前必先 backup** — 升级失败会丢失配置
- **优先使用内置插件，不要造轮子** — 105 个插件覆盖绝大多数 CRM 需求
- **改 schema 前导出快照** — 改坏了能 1 分钟还原
- **配置不写代码** — 写代码前先确认 NocoBase 内置功能无法满足

**记住**：质量不是可选项。CRM 的每个字段、每条规则都直接关联工厂的真金白银——准确性永远优先于速度。
