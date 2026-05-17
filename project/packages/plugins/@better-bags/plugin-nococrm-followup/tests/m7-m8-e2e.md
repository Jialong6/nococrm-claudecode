# M7 + M8 端到端测试清单 (T7.05 + T8.06)

> 在 NocoBase UI 完成"手动配置清单"后执行。每条 30 秒至 2 分钟可验证。

## 准备
- 启用 `@better-bags/plugin-nococrm-core` + `plugin-nococrm-quotation` + `plugin-nococrm-followup`
- 启用 `plugin-workflow*` / `plugin-notification-email` / `plugin-block-list`
- 至少 1 个 sales 账号 + 1 个 sales_manager 账号
- M5/M6 已经创建至少 1 个 inquiry + 1 个 quotation

---

## 场景 1：followup_scripts 预置数据（T7.04）
1. 打开"跟进话术"列表
- 期望：
  - [ ] 共有 12 条记录
  - [ ] scenario 覆盖 decision_check / new_case / tech_support / greeting 各 3 条
  - [ ] 每种 scenario 含 zh / en / ja 三语
  - [ ] body 字段含 `{{customer.primary_contact}}` 等变量占位

## 场景 2：quotation.followup_due_at 字段就位（T7.02）
1. 进入任何一个 quotation 详情
- 期望：
  - [ ] 看到"下次跟进截止 (followup_due_at)"字段
  - [ ] 字段为只读
  - [ ] 字段描述提示 "status 切换到 sent 时自动 = sent_at + 14 天"

## 场景 3：sent 自动写 followup_due_at（T7.02）
1. 找一个 status=draft 的 quotation，把 status 改为 `sent`
2. 保存
- 期望：
  - [ ] sent_at 自动填当前时间（M5/M6 quotation 已有这个 hook）
  - [ ] followup_due_at 自动 = sent_at + 14 天

## 场景 4：30 天无联系定时工作流（T7.03）
1. 按 README 在 plugin-workflow-schedule 配置每天 9:00 扫描
2. 找一个 priority=B 的客户，把 last_contact_at 改为 35 天前
3. 手动触发工作流（或等定时）
- 期望：
  - [ ] customer.owner 收到任务 "[X 公司] 30 天无联系，请主动跟进"
  - [ ] 任务关联 customer

## 场景 5：negotiation_scripts 预置数据（T8.05）
1. 打开"谈判话术"列表
- 期望：
  - [ ] 共有 12 条记录
  - [ ] concern_category 覆盖 price / lead_time / payment / moq 各 3 条
  - [ ] 每种 category 含 zh / en / ja 三语
  - [ ] body 含具体话术，引用业务红线（如"MOQ 1500"、"T/T 30/70"、"AQL 2.5"）

## 场景 6：谈判记录自动同步（T8.01）
1. 给某个 quotation 创建一条 negotiation
2. 不填 round_no, customer, occurred_at
3. 只填 customer_concerns=[price], concern_detail="价格偏高"
4. 保存
- 期望：
  - [ ] round_no 自动 = 1
  - [ ] customer_id 自动 = quotation.customer_id
  - [ ] occurred_at 自动 = 当前时间

## 场景 7：谈判轮次自动递增（T8.01）
1. 给同一个 quotation 再建 3 条 negotiation，全部不填 round_no
- 期望：
  - [ ] round_no 依次 = 2, 3, 4

## 场景 8：谈判轮次 ≥ 5 触发止损（T8.03）
1. 创建第 5 条 negotiation
2. 保存
- 期望：
  - [ ] quotation.pending_approval_reason 字段被自动追加：`[YYYY-MM-DD] 谈判已 5 轮，建议销售经理评估止损（来自 SOP 阶段 7 红线）`
- 1. 再创建第 6 条
- 期望：
  - [ ] pending_approval_reason 不重复追加（幂等）

## 场景 9：谈判时间线视图（T8.04）
1. 按 README 在 quotation 详情页添加 list block
2. 数据表 negotiations + filter quotation_id + sort round_no asc
- 期望：
  - [ ] 看到 6 条 negotiation 按 round_no 1-6 升序
  - [ ] 卡片显示 occurred_at / customer_concerns / our_response / concession_value / outcome
  - [ ] 一眼能看出谈判节奏

## 场景 10：让步累计统计（T8.02 衍生）
1. 给每条 negotiation 填 concession_discount_pct（如 0 / 2.5 / 5 / 5 / 7.5 / 10）
2. 在 quotation 详情添加 chart block sum 该字段
- 期望：
  - [ ] 累计折扣显示 30%
  - [ ] 可帮助经理判断是否已经接近底线

## 场景 11：14 天未决策定时工作流（T7.02）
1. 按 README 配置定时
2. 手动把 followup_due_at 改成 1 天前（mock 14 天后）
3. 手动触发工作流
- 期望：
  - [ ] customer.owner 收到任务 "[QT-xxx] 14 天未决策，请安排跟进"
  - [ ] 邮件提示选用 decision_check 场景的 followup_scripts

---

## 验收勾选
- [ ] 场景 1-2：M7 数据 + 字段扩展
- [ ] 场景 3-4：M7 hook + 定时工作流
- [ ] 场景 5-7：M8 谈判表 + 自动同步
- [ ] 场景 8：M8 谈判止损 hook
- [ ] 场景 9-10：M8 视图 + 让步统计
- [ ] 场景 11：M7 14 天定时

## 已知缺陷与未覆盖项
- T7.03 / T7.02 定时工作流依赖 NocoBase 的 plugin-workflow-schedule，需用户在 UI 配置
- 累计让步统计基于 chart block 而非 collection 字段，跨 quotation 比较仍需自建 dashboard
- 谈判话术按 concern 单值匹配；negotiations.customer_concerns 是多值，需 UI 配合做关联（取第一个 concern 拉对应话术）
