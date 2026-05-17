# M16 报表端到端测试清单 (T16 验收)

## 准备
- 启用 plugin-nococrm-* 全套（M1-M14）+ plugin-nococrm-reports
- 至少有：20 个客户（覆盖 A/B/C/D），10 个 inquiries，5 个 quotations，5 个 orders 含 delivered，10 个 samples（含 first/second/pp），10 个 payments

---

## 场景 1：funnelStats 返回 8 阶段
- GET `/api/customers:funnelStats`
- 期望：响应数组长度 = 8，每条含 stage/label/count/conversion，total 一致

## 场景 2：funnelStats 按 owner_id 过滤
- GET `/api/customers:funnelStats?owner_id=1`
- 期望：只统计 owner_id=1 的客户

## 场景 3：salesPerformance 按月分组
- GET `/api/orders:salesPerformance?period=month`
- 期望：响应按 owner × period 聚合，total_amount = sum(quantity * unit_price)

## 场景 4：salesPerformance 按季分组
- GET `/api/orders:salesPerformance?period=quarter`
- 期望：period 格式为 `2026-Q1`

## 场景 5：capacityUtilization 双工厂对比
- GET `/api/factories:capacityUtilization`
- 期望：响应含 MM_YGN（capacity 200000）和 CN_RZ（capacity 50000），各 period 有 utilization_pct

## 场景 6：samplesConversion 5 类样品
- GET `/api/samples:conversionRate`
- 期望：响应 5 条，first 转化率 100%，其他相对 first 计算

## 场景 7：statusDuration 8 阶段 P25/P50/P75/P95
- GET `/api/customers:statusDuration`
- 期望：响应 8 条，每条含 4 个分位

## 场景 8：priorityDistribution 当前分布
- GET `/api/customers:priorityDistribution`
- 期望：current 数组 4 条（A/B/C/D），trend 缺省

## 场景 9：priorityDistribution 含趋势
- GET `/api/customers:priorityDistribution?trend=true`
- 期望：除 current 外，trend 按月分组

## 场景 10：cashFlow 本月
- GET `/api/payments:cashFlow`
- 期望：含 deposit_receivable / deposit_paid / deposit_overdue / balance_* / total_*

## 场景 11：cashFlow 指定月
- GET `/api/payments:cashFlow?month=2026-04`
- 期望：仅返回 2026-04 应付日期的 payments

## 场景 12：ACL 拒绝匿名调用
- 未登录 GET `/api/customers:funnelStats`
- 期望：401

## 场景 13：UI chart block 渲染
- 在 NocoBase UI 添加 funnel chart，数据源选 customers:funnelStats
- 期望：漏斗图正常渲染

---

## 验收勾选
- [ ] funnelStats / salesPerformance / capacityUtilization 三个核心报表
- [ ] samplesConversion / statusDuration / priorityDistribution 三个辅助报表
- [ ] cashFlow 财务报表
- [ ] ACL 权限校验
- [ ] UI chart block 集成

## 已知缺陷与未覆盖项
- statusDuration 用 updated_at 估算停留时长，不能区分中途多次状态切换；理想方案依赖 plugin-audit-logs
- salesPerformance 当 customer.owner 关联缺失时显示 "User#X" 兜底
- capacityUtilization 用 order.quantity 累加，不区分 actual_end < period_end 的实际产出；仅供决策参考
- 所有 action 没有缓存，频繁调用 chart 时建议加 Redis 缓存（M17 上线后优化）
