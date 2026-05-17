# @better-bags/plugin-nococrm-reports

Better Bags NocoCRM 报表与可视化插件 — **M16 全局横向：看板、漏斗、报表** 的实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) M16 共 **7 个任务**，本插件注册 7 个后端聚合 resource action，供 UI 中 chart / kanban / dashboard block 直接调用。

启用后：

| Action | 任务 | 输出 |
|--------|------|------|
| `customers:funnelStats` | T16.01 13 阶段漏斗 | 8 段（new → following → ... → lost）count + conversion% |
| `orders:salesPerformance` | T16.02 销售业绩 | 按业务员 × 月/季 的 order_count / total_amount / avg_amount |
| `factories:capacityUtilization` | T16.03 工厂产能 | 按工厂 × 月 的 used_pcs / capacity_pcs / utilization% |
| `samples:conversionRate` | T16.04 打样转化率 | 5 类样品 count + 相对首样转化% |
| `customers:statusDuration` | T16.05 阶段停留时长 | 8 段 P25/P50/P75/P95（天） |
| `customers:priorityDistribution` | T16.06 A/B/C/D 分布 | current 饼图 + trend 月度趋势 |
| `payments:cashFlow` | T16.07 现金流 | 本月 应收/已收/逾期（定金+尾款分组） |

## 依赖

- `plugin-nococrm-core`（customers / factories）
- `plugin-nococrm-quotation`（samples）
- `plugin-nococrm-orders`（orders / payments / production_plans）
- 推荐：`plugin-data-visualization-echarts`（前端图表渲染）

## 启用步骤

```bash
cd project && yarn install && yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 报表与可视化" → 启用
```

## API 文档

### 1. customers:funnelStats — T16.01

**请求**
```
GET /api/customers:funnelStats?dateRange=2026-01-01,2026-05-31&owner_id=1
```
**响应**
```json
[
  {"stage": "new", "label": "新建", "count": 8, "conversion": 12},
  {"stage": "following", "label": "跟进中", "count": 15, "conversion": 22},
  ...
  {"stage": "closed", "label": "已成交", "count": 5, "conversion": 7}
]
```
**UI 配置**：chart block → funnel chart → 数据源选此 action → x 轴=label, y 轴=count

### 2. orders:salesPerformance — T16.02

**请求**
```
GET /api/orders:salesPerformance?period=month&dateRange=2026-01-01,2026-05-31
```
**响应**
```json
[
  {"owner_id": 1, "owner_name": "张三", "period": "2026-03", "order_count": 3, "total_amount": 45000, "avg_amount": 15000},
  ...
]
```
**UI 配置**：双轴图（柱状 order_count + 折线 total_amount）

### 3. factories:capacityUtilization — T16.03

**请求**
```
GET /api/factories:capacityUtilization?dateRange=2026-01-01,2026-05-31
```
**响应**
```json
[
  {"factory_code": "MM_YGN", "factory_name": "缅甸仰光工厂", "period": "2026-05", "used_pcs": 150000, "capacity_pcs": 200000, "utilization_pct": 75},
  {"factory_code": "CN_RZ", "factory_name": "山东日照主厂", "period": "2026-05", "used_pcs": 30000, "capacity_pcs": 50000, "utilization_pct": 60}
]
```
**UI 配置**：双工厂对比柱状

### 4. samples:conversionRate — T16.04

**请求**
```
GET /api/samples:conversionRate?dateRange=2026-01-01,2026-05-31
```
**响应**
```json
[
  {"sample_type": "first", "label": "首样", "count": 50, "conversion_from_first_pct": 100},
  {"sample_type": "second", "label": "二次样", "count": 30, "conversion_from_first_pct": 60},
  ...
  {"sample_type": "pp", "label": "PP 样", "count": 15, "conversion_from_first_pct": 30}
]
```
**UI 配置**：funnel chart 反映打样漏斗（哪一关掉单最多）

### 5. customers:statusDuration — T16.05

**请求**
```
GET /api/customers:statusDuration
```
**响应**
```json
[
  {"status": "following", "label": "跟进中", "count": 15, "p25": 3, "p50": 7, "p75": 14, "p95": 30},
  ...
]
```
**UI 配置**：boxplot 箱线图（识别最慢阶段）
**注**：简化版用 updated_at - created_at 估算；理想方案依赖 audit_logs

### 6. customers:priorityDistribution — T16.06

**请求**
```
GET /api/customers:priorityDistribution?trend=true
```
**响应**
```json
{
  "current": [
    {"value": "A", "label": "A 类 - 现有客户", "color": "#2e7d32", "count": 5},
    ...
  ],
  "trend": [
    {"month": "2026-01", "A": 3, "B": 8, "C": 12, "D": 20},
    ...
  ]
}
```
**UI 配置**：饼图（current） + 折线图（trend）

### 7. payments:cashFlow — T16.07

**请求**
```
GET /api/payments:cashFlow?month=2026-05
```
**响应**
```json
{
  "month": "2026-05",
  "deposit_receivable": 30000,
  "deposit_paid": 25000,
  "deposit_overdue": 5000,
  "balance_receivable": 70000,
  "balance_paid": 50000,
  "balance_overdue": 0,
  "total_receivable": 100000,
  "total_paid": 75000,
  "total_overdue": 5000
}
```
**UI 配置**：分组柱状（定金/尾款 × 应收/已收/逾期）

## 业务红线对应

| 红线 | 来源 | 用 action 监控 |
|------|------|---------------|
| 13 阶段客户漏斗瓶颈 | SOP 阶段 1-13 | funnelStats |
| 缅甸 MOQ 1500 + 山东急单分流 | 03 知识库 | capacityUtilization（看缅甸利用率） |
| 90 天大货交期 | 04 知识库 | 通过 orders.committed_delivery 间接体现 |
| 打样 ≥ 4 次红线 | 05 知识库 | samplesConversion（看 fourth + pp 比例） |
| T/T 30/70 健康 | 06 知识库 | cashFlow 看 overdue 比例 |
| A/B/C/D 分级合理性 | CLAUDE.md | priorityDistribution 看趋势 |

## 推荐 Dashboard 布局

2×4 网格（参考）：

```
┌──────────────┬──────────────┐
│ 13 阶段漏斗   │ 客户分级饼图  │
├──────────────┼──────────────┤
│ 销售业绩柱状  │ 现金流分组    │
├──────────────┼──────────────┤
│ 工厂产能对比  │ 打样转化漏斗  │
├──────────────┴──────────────┤
│       阶段停留时长（箱线）   │
└─────────────────────────────┘
```

## UI 配置清单

1. 启用 `plugin-data-visualization-echarts`
2. 进入"界面管理 → 桌面端 → 新建页面 数据仪表板"
3. 添加图表块，每个图表：
   - **数据源类型**：选 "Custom API"
   - **API 路径**：`/api/customers:funnelStats`（按上表填）
   - **请求方法**：GET
   - **参数**：UI 中填 dateRange / owner_id 等
   - **图表类型**：funnel / bar / line / pie / boxplot
4. 保存页面

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| chart block 报 401 | 用户未登录 | 重登；检查 ACL allow |
| funnelStats 返回空 | customers 表没数据 | 创建测试客户 |
| salesPerformance owner_name 全是 "User#X" | customer.owner 关联未加载 | 数据源关联字段配 appends |
| capacityUtilization utilization_pct 为 0 | factories.capacity_monthly_pcs 没填 | 检查 plugin-nococrm-core seed |
| statusDuration p50 与实际不符 | 用 updated_at 估算，不精确 | 后续接入 plugin-audit-logs |
| cashFlow 数字翻倍 | payments 数据重复 | 检查 M9 hook 是否幂等（应已修复） |

## 目录结构

```text
plugin-nococrm-reports/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # 注册 7 个 actions + ACL
│   │   └── actions/
│   │       ├── funnelStats.ts              # T16.01
│   │       ├── salesPerformance.ts         # T16.02
│   │       ├── capacityUtilization.ts      # T16.03
│   │       ├── samplesConversion.ts        # T16.04
│   │       ├── statusDuration.ts           # T16.05
│   │       ├── priorityDistribution.ts     # T16.06
│   │       └── cashFlow.ts                 # T16.07
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
└── tests/
    └── m16-reports-e2e.md
```

## License

AGPL-3.0
