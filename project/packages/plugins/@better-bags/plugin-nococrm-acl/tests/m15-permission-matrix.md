# M15 权限矩阵测试清单 (T15.06)

> 启用 plugin-nococrm-acl 后，按下面 9 × 4 = 36 个场景逐一勾选。

## 准备
- 创建 9 个测试用户，每人分配单一角色：
  - admin01 / mgr01 / sales01 / sales02 / fin01 / qd01 / ygn01 / qc01 / proc01 / ro01
- sales01 持有客户 A，sales02 持有客户 B
- 至少 1 个 MM_YGN 订单 + 1 个 CN_RZ 订单

---

## 业务员数据隔离（T15.02）

### 场景 1：sales01 看自己客户
- sales01 登录 → customers 列表
- 期望：只显示 owner=sales01 的客户 A

### 场景 2：sales01 看不到 sales02 的客户
- 期望：列表不含客户 B；直接访问 customers/{B.id} 应 403

### 场景 3：sales01 看不到自己客户之外的询盘
- 期望：inquiries 只显示 customer.owner=sales01 的记录

### 场景 4：sales01 看不到自己客户之外的报价
- 期望：quotations 同上

---

## 财务字段隔离（T15.03）

### 场景 5：fin01 customers 列表无联系方式
- fin01 登录 → customers 列表
- 期望：列表/详情页 phone / email / wechat / whatsapp 字段不显示

### 场景 6：fin01 payments 全权
- 期望：list / create / update / approve 都允许

### 场景 7：fin01 cost_estimates 全读
- 期望：能看到全部 cost / margin 字段

### 场景 8：fin01 看 orders 但不能写
- 期望：list/get 通过，update/destroy 403

---

## 工厂数据隔离（T15.04）

### 场景 9：qd01 看不到 MM_YGN 订单
- qd01 登录 → orders 列表
- 期望：只显示 production_factory ∈ {CN_QD, CN_RZ} 的订单

### 场景 10：qd01 看不到 MM_YGN 排产
- 期望：production_plans 同上

### 场景 11：ygn01 看不到 CN_RZ 订单
- 期望：只显示 MM_YGN 订单

### 场景 12：ygn01 看不到客户表
- 期望：customers list 应 403

---

## 敏感字段隔离（T15.05）

### 场景 13：sales01 看不到 cost_estimate 成本字段
- sales01 打开 cost_estimates 列表
- 期望：material_cost / labor_cost / overhead / logistics_cost / margin_rate / margin_value 字段不显示
- 期望：final_price 显示

### 场景 14：mgr01 看到全部 cost_estimate 字段
- 期望：所有字段可见可编辑

### 场景 15：fin01 看到全部 cost_estimate 字段
- 期望：所有字段可见

---

## QC / 采购 / 只读（验证基础 allow）

### 场景 16：qc01 qc_reports 全权
- 期望：list / create / update 全部通过

### 场景 17：qc01 不能改 orders
- 期望：list/get 通过，update 403

### 场景 18：proc01 materials 全权
- 期望：list / create / update 通过

### 场景 19：ro01 所有表只读
- 期望：list/get 通过；create/update/destroy 全部 403

---

## 角色组合（重要！）

### 场景 20：admin01 不受任何隔离影响
- 期望：所有表 / 所有字段 全部可见

### 场景 21：用户挂多角色（mgr01 + sales）
- 期望：取并集（最宽松），看到本部门 + 自己客户

---

## 验收勾选
- [ ] 业务员隔离：场景 1-4
- [ ] 财务隔离：场景 5-8
- [ ] 工厂隔离：场景 9-12
- [ ] 字段隔离：场景 13-15
- [ ] 基础 allow：场景 16-19
- [ ] 角色组合：场景 20-21

## 已知缺陷与未覆盖项
- 销售经理"本部门"范围需要 plugin-departments + 用户 department 字段；当前简化为 sales_manager 全部门可见
- 字段权限通过 fixedParams.fields 在 list/get 生效；如果走 association 接口可能绕过，需要 UI 中再叠加字段权限
- 多角色 ACL 默认取并集；某些场景下需要"取交集"则需用户在 UI 手动调整
