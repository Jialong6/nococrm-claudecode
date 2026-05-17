# NocoCRM - Better Bags 中缅双工厂客户管理系统

基于 [NocoBase](https://www.nocobase.com/) 开源 no-code 平台搭建的箱包 OEM 客户管理系统，承载 Better Bags Myanmar 完整的 13 阶段客户转化 SOP。

## 项目结构

```text
nocoCRM-ClaudeCode/
├── CLAUDE.md                            # Claude Code 项目总指南
├── tasks.md                             # 17 个里程碑、123 个任务的施工蓝图
├── 01-公司概况与核心优势.md              # 业务知识库
├── 02-工厂硬件与设备产能.md
├── 03-产品线与接单策略.md
├── 04-供应链与交期管理.md
├── 05-研发打样与确认流.md
├── 06-商务条款与报价规范.md
├── project/                             # NocoBase 主仓库（保持原样）
│   └── packages/plugins/
│       ├── @nocobase/                   # 105 个官方插件
│       └── @better-bags/                # 本项目自建插件
│           └── plugin-nococrm-core/     # M1+M2 实施
├── commands/                            # slash command 定义
├── rules/                               # 编码与协作规范
├── skills/ subagents/ hooks/            # Claude Code 扩展
```

## 当前进度

| 里程碑 | 范围 | 状态 |
|--------|------|------|
| M0 环境准备 | NocoBase 安装与插件启用 | ⏳ 待执行 |
| **M1 基础数据架构** | departments/factories/categories/dicts | ✅ **已实施** |
| **M2 客户获取与分类** | customers/contacts/lead_sources/A-B-C-D 分级 | ✅ **已实施** |
| **M3 会议与沟通** | meetings/agenda templates | ✅ **已实施** |
| **M4 首次沟通会议** | meeting_notes/company_assets/首次会议回写 | ✅ **已实施** |
| **M5 会后跟进与报价** | inquiries/cost_estimates/完整度评分 | ✅ **已实施** |
| **M6 报价与打样** | quotations/samples/工厂路由/交期校验/价格底线/打样高风险 | ✅ **已实施** |
| **M7 信任建立与跟进** | followup_scripts/quotations.followup_due_at/14 天跟进截止 | ✅ **已实施** |
| **M8 合同谈判** | negotiations/negotiation_scripts/谈判轮次 ≥ 5 止损 | ✅ **已实施** |
| M9 - M17 | 见 [tasks.md](./tasks.md) | 待续 |

实施成果按里程碑拆分成独立插件：

- M1/M2 → [`project/packages/plugins/@better-bags/plugin-nococrm-core/`](./project/packages/plugins/@better-bags/plugin-nococrm-core/)
- M3/M4 → [`project/packages/plugins/@better-bags/plugin-nococrm-meetings/`](./project/packages/plugins/@better-bags/plugin-nococrm-meetings/)
- M5/M6 → [`project/packages/plugins/@better-bags/plugin-nococrm-quotation/`](./project/packages/plugins/@better-bags/plugin-nococrm-quotation/)
- M7/M8 → [`project/packages/plugins/@better-bags/plugin-nococrm-followup/`](./project/packages/plugins/@better-bags/plugin-nococrm-followup/)

## 快速启动

```bash
# 1. 安装依赖
cd project
yarn install

# 2. 配置环境
cp .env.example .env   # 然后填写数据库与 APP_KEY

# 3. 初始化 + 启动
yarn nocobase install
yarn dev

# 4. 浏览器访问
open http://localhost:13000

# 5. 启用插件
# 后台 → 插件管理 → "NocoCRM 核心" → 启用
```

## 业务背景

- **公司**：Better Bags Myanmar（成立 2003 年，20+ 年箱包 OEM/ODM 经验）
- **双工厂**：山东日照主厂 + 缅甸仰光大货工厂 + 青岛打样中心
- **主要市场**：日本（含品牌商、贸易商、设计公司）
- **关键约束**：
  - 缅甸大货 MOQ ≥ 1500 件/款/色
  - 大货交期 ≥ 90 天（PP 样确认起算）
  - 新客户付款：T/T 30% 定金 + 70% 尾款
  - 打样 ≥ 4 次自动标红
  - AQL 2.5 抽检
  - 报价默认 FOB Yangon / FOB Qingdao

详见 6 份业务知识库 `01-06.md`。

## License

- 本项目代码（含 @better-bags/* 插件）：AGPL-3.0
- 上游 NocoBase：AGPL-3.0
