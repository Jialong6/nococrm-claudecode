# M2 端到端测试清单 (T2.10)

> 在 NocoBase UI 完成手动配置清单后执行。每条 30 秒以内即可验证。

## 准备
- 启用 `@better-bags/plugin-nococrm-core` 与 `plugin-workflow` 系列
- 至少创建 2 个测试账号：sales01 / sales_manager
- 工作时间窗口配置为"任意"以便快速测试

## 场景 1：标准询盘（工作时间）
1. 用 admin 账号在 customers 表创建一条记录：company_name="日本测试商社"、country=JP、source=网站表单、annual_volume_estimate=80000、owner=sales01
2. 期望：
   - customer_code 自动生成 `CUST-202605-001`
   - priority 被自动分级工作流改为 `B`（年单量 ≥ 50000）
   - sales01 立即收到站内信 + 4h 跟进任务

## 场景 2：非工作时间
1. 把工作流的"工作时间窗口"临时改为 凌晨 1:00-2:00
2. 创建一条 customers
3. 期望：
   - 立即收到 `auto_reply_zh/en/ja` 邮件（按 customer.country 路由语言）
   - 次日 9:30 弹出跟进任务

## 场景 3：低分客户
1. 创建一条 customers：annual_volume_estimate=500、source=其他
2. 期望：priority 被设为 `D`，颜色灰色

## 场景 4：高优先级置顶
1. 在 customers 列表视图查看
2. 期望：priority=A 的记录显示在最前
3. Kanban 视图按 priority 4 列显示

## 场景 5：联系人多对一
1. 给 "日本测试商社" 新建 3 个 contacts：决策人 / 采购 / 财务
2. 把"决策人"标 is_primary=true
3. 期望：标其他联系人 is_primary 时提示"主联系人唯一"

## 场景 6：字典只读
1. 用 sales01（非 admin）登录
2. 打开 lead_sources：能看到 11 条但不能新增/修改
3. 打开 regions_dict / currencies_dict / factories / product_categories：同上

## 验收勾选
- [ ] 场景 1 通过（自动分级 + 4h 任务）
- [ ] 场景 2 通过（自动邮件 + 次日任务）
- [ ] 场景 3 通过（D 类灰色）
- [ ] 场景 4 通过（A 置顶 + Kanban 4 列）
- [ ] 场景 5 通过（主联系人唯一性）
- [ ] 场景 6 通过（字典只读）
