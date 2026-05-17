# M5 + M6 端到端测试清单 (T5.08 + T6.12)

> 在 NocoBase UI 完成"手动配置清单"后执行。每条 30 秒至 2 分钟可验证。

## 准备
- 启用 `@better-bags/plugin-nococrm-core` + `@better-bags/plugin-nococrm-meetings` + `@better-bags/plugin-nococrm-quotation`
- 启用 `plugin-kanban` / `plugin-workflow*` / `plugin-action-print` / `plugin-field-sequence` / `plugin-field-formula`
- M2 已经有至少 2 个客户记录（包括 1 个新客户 status=new，1 个已成交客户 status=closed）
- 至少 1 个 sales 账号 + 1 个 sales_manager 账号

---

## 场景 1：询盘完整度评分（T5.04）
1. 用 sales 账号创建 inquiry：customer=日本测试商社，product_category=背包，其他全部留空
2. 保存
- 期望：
  - [ ] inquiry_no 自动 `INQ-YYYYMMDD-001`
  - [ ] completeness_score = 20（只有 product_category 计分）
  - [ ] status 自动 = `refining`（需求完善）

## 场景 2：补全后自动进入核价（T5.04）
1. 编辑场景 1 的 inquiry，补 quantity=2000, material="尼龙", color="黑色", target_price=8.5, delivery_request=未来 4 个月后
2. 上传至少一个 sketch_url 附件
3. 保存
- 期望：
  - [ ] completeness_score = 90+（满分 100）
  - [ ] status 自动 = `costing`（已交核价）

## 场景 3：核价创建 + 字段公式（T5.05）
1. 用 admin 账号给场景 2 的 inquiry 创建 cost_estimate
2. material_cost=4.0, labor_cost=1.5, overhead=0.8, logistics_cost=0, margin_rate=10, final_price=8.0
3. 保存
- 期望：
  - [ ] margin_value = 8.0 - (4.0+1.5+0.8+0) = 1.7（field-formula 自动算）

## 场景 4：缅甸大货路由 + FOB 默认（T6.02 + T6.05）
1. 创建 quotation：inquiry=场景 2 的（quantity=2000）, unit_price=8.5, currency=USD
2. 不填 production_factory 与 incoterms
3. 保存
- 期望：
  - [ ] production_factory 自动 = `MM_YGN`（数量 ≥ 1500 且非急单）
  - [ ] incoterms 自动 = `FOB Yangon`
  - [ ] valid_until 自动 = 创建日 + 30 天
  - [ ] customer_id 自动同步 inquiry 的客户

## 场景 5：急单路由日照（T6.05）
1. 改 inquiry.is_urgent = true
2. 创建第二个 quotation，quantity=2000
3. 保存
- 期望：
  - [ ] production_factory = `CN_RZ`（即使数量 ≥ 1500，急单也走日照）
  - [ ] incoterms = `FOB Qingdao`

## 场景 6：小单路由日照（T6.05）
1. 创建 quotation：quantity=800（< 1500）
2. 保存
- 期望：
  - [ ] production_factory = `CN_RZ`
  - [ ] incoterms = `FOB Qingdao`

## 场景 7：缅甸大货交期硬下限（T6.04）
1. 创建 quotation：production_factory=MM_YGN, quantity=2000, lead_time_days=60
2. 保存
- 期望：
  - [ ] 报错："缅甸大货交期不得短于 90 天（来自 04 知识库 PP 样确认 + 3 个月）"
  - [ ] 记录未保存

## 场景 8：新客户禁选 T/T 见提单（T6.03）
1. 创建 quotation 对应"日本测试商社"（status=new 的新客户），payment_terms=tt_bl
2. 保存
- 期望：
  - [ ] 报错："T/T 见提单复印件付款 仅 VIP 客户可用..."
  - [ ] 记录未保存

## 场景 9：VIP 客户可选 T/T 见提单（T6.03）
1. 修改场景 8 的 customer.status = `closed`
2. 用 admin 直接造 3 条 orders（M9 之前可以跳过此步，模拟 orderCount ≥ 3）
3. 创建 quotation, payment_terms=tt_bl
- 期望：
  - [ ] 创建成功，不报错
  - 若 orders 表不存在（M9 前）：报错信息中提示需要订单数 ≥ 3，可手动建 orders 表占位测

## 场景 10：价格底线自动锁回 draft（T6.06）
1. 沿用场景 3 的 cost_estimate（final_price=8.0）
2. 创建 quotation：unit_price=7.0（低于 final_price）
3. 把 status 改为 `sent`，保存
- 期望：
  - [ ] status 被自动改回 `draft`
  - [ ] pending_approval_reason 字段写入"单价 7 低于建议价 8，需销售经理审批"

## 场景 11：单价 ≥ 建议价 可直接发送（T6.06）
1. 同上但 unit_price=8.5（≥ final_price）
2. status 改 `sent`
- 期望：
  - [ ] status = `sent`（允许）
  - [ ] sent_at 自动填当前时间

## 场景 12：样品默认值（T6.07）
1. 创建 sample：quotation=场景 4 的, requested_at=今天
2. 不填 planned_finish_at 与 sampling_factory
3. 保存
- 期望：
  - [ ] sampling_factory 自动 = `CN_QD`（青岛打样中心）
  - [ ] planned_finish_at = today + 7d
  - [ ] customer_id 自动 = quotation.customer_id
  - [ ] sample_no 自动 `SP-YYYYMMDD-001`

## 场景 13：打样 4 次触发高风险（T6.08）
1. 给同一个 quotation 创建样品，依次 revision_no = 1, 2, 3
2. 检查 customer.risk_flag —— 应当还是 false
3. 创建第 4 个样品，revision_no = 4
- 期望：
  - [ ] 客户 risk_flag 自动 = true
  - [ ] customer.notes 追加一行 `[YYYY-MM-DD] 打样已达 4 次，触发高风险（05 知识库红线）`

## 场景 14：样品 Kanban 拖拽（T6.11）
1. 配置 samples Kanban view，按 status 分 6 列
2. 把一个 sample 从 producing 拖到 shipped
- 期望：
  - [ ] 拖拽成功
  - [ ] sample.status 已更新

## 场景 15：PDF 报价单导出（T6.10）
1. 在 quotation 详情 → 点击"打印 PDF" action
2. 浏览器打开打印预览
- 期望：
  - [ ] 抬头显示 Better Bags + 双工厂地址
  - [ ] 客户信息 / 产品规格 / 总额 / FOB 条款 / 交期 / 签字栏齐全
  - [ ] 中英双语显示
  - [ ] 可保存为 PDF

---

## 验收勾选
- [ ] 场景 1-3：M5 询盘 + 核价 链路
- [ ] 场景 4-6：M6 工厂路由 + FOB 默认
- [ ] 场景 7-9：M6 交期/付款条款硬校验
- [ ] 场景 10-11：M6 价格底线审批
- [ ] 场景 12-13：M6 样品默认值 + 高风险
- [ ] 场景 14：Kanban
- [ ] 场景 15：PDF 导出

## 已知缺陷与未覆盖项
- 字段级 ACL（cost_estimates 业务员看不到 cost）完整实现留 M15
- payment_terms tt_bl 校验依赖 orders 表（M9 引入），M9 之前 orderCount 始终为 0，所有客户都会被阻止 tt_bl —— 此为预期行为
- T6.09 首样 7 天无反馈跟进依赖定时工作流，需用户在 UI 配置
- PDF 模板使用浏览器打印机制，需配合 plugin-action-print
- 报价版本快照（plugin-snapshot-field 集成）留待后续优化
