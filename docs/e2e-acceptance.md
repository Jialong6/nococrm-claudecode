# 端到端验收 — 20 客户全 13 阶段（T17.01）

> 上线前用 mock 数据走通完整 SOP，验证所有状态机闭环 + 跨插件 hook 联动。

## 准备 mock 数据

启用 `plugin-mock-collections`（仅测试环境）：

```bash
# 在测试库执行，生成 20 个客户
docker compose ... exec app yarn nocobase mock-collections customers --count 20
```

或手动造 20 个客户，分布：
- A 类 3 个（已成交老客户）
- B 类 6 个（重要新客户）
- C 类 8 个（一般潜客）
- D 类 3 个（低意向）

## 完整 13 阶段走查（取 1 个代表客户跑全程）

### 阶段 1 客户获取（plugin-nococrm-core）
- [ ] 创建客户，customer_code 自动生成
- [ ] 自动分级 A/B/C/D
- [ ] 工作时间内 4h 跟进待办出现

### 阶段 2-3 会议（plugin-nococrm-meetings）
- [ ] 创建会议，选议程模板自动填充 agenda
- [ ] 会议完成 → customer.first_meeting_at 回写

### 阶段 4 询盘（plugin-nococrm-quotation）
- [ ] 询盘 completeness_score 计算正确
- [ ] < 80 自动"需求完善"，≥ 80 自动"已交核价"

### 阶段 5 报价打样
- [ ] 2000 件订单自动路由缅甸 + FOB Yangon
- [ ] 800 件自动路由山东 + FOB Qingdao
- [ ] 新客户 T/T 见提单被拦
- [ ] 缅甸交期 60 天被拦
- [ ] 低于成本价报价锁草稿
- [ ] 打样第 4 次 → 客户标红

### 阶段 6-7 跟进谈判（plugin-nococrm-followup）
- [ ] 14 天未决策 followup_due_at 字段就位
- [ ] 谈判第 5 轮 → 止损提示

### 阶段 8 订单（plugin-nococrm-orders）
- [ ] 合同签署 → 自动建单 + 30% 定金 + customer.status='ordered'
- [ ] 缅甸订单 quantity < 1500 被拦

### 阶段 9 生产准备
- [ ] 定金到账 → 订单解锁 + 70% 尾款 + 排产记录
- [ ] 物料 po_date → 三个齐套日自动算

### 阶段 10 生产质检（plugin-nococrm-fulfillment）
- [ ] 生产进度 cumulative_qty 累加正确
- [ ] 异常 issues → order.notes 标记
- [ ] QC 最终通过 → 订单"已完成"

### 阶段 11 发货
- [ ] 尾款未付不能发货（VIP 例外）
- [ ] 缺文件不能切"已开船"
- [ ] 提单号录入 → atd 自动填
- [ ] status=delivered → order.delivered

### 阶段 12 复盘（plugin-nococrm-retention）
- [ ] 订单完结 → 首单 customer='closed'，多单 'maintaining'
- [ ] 满意度 ≤ 2 → risk_flag=true
- [ ] 满意度 ≥ 4 → risk_flag=false

### 阶段 13 长期维护
- [ ] maintaining 客户新询盘 → 切回 following
- [ ] last_order_at 维护正确

## 横向验收

### M15 权限（plugin-nococrm-acl）
- [ ] 见 plugin-nococrm-acl/tests/m15-permission-matrix.md 21 场景

### M16 报表（plugin-nococrm-reports）
- [ ] 7 个 action 都能返回数据
- [ ] chart block 渲染正常

### M17 运维（plugin-nococrm-ops）
- [ ] ops:testAlert 三渠道收到

## 验收结论

- [ ] 13 阶段无中断
- [ ] 所有状态机闭环（customer / inquiry / quotation / sample / order / payment / production / shipment）
- [ ] 跨插件 hook 联动正确（合同→订单→付款→排产→质检→发货→复盘→分级流转）
- [ ] 6 大业务红线全部生效（MOQ 1500 / 交期 90 / T/T 30/70 / 打样 4 次 / AQL 2.5 / FOB 默认）

**验收人**：____________  **日期**：____________
