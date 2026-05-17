# M3 + M4 端到端测试清单 (T3.06 + T4.05)

> 在 NocoBase UI 完成"手动配置清单"后执行。每条 30 秒到 2 分钟可验证。

## 准备
- 启用 `@better-bags/plugin-nococrm-core` 与 `@better-bags/plugin-nococrm-meetings`
- 启用 `plugin-calendar` / `plugin-workflow*` / `plugin-notification-email`
- 至少 1 个 admin 账号 + 1 个 sales 账号 + 1 个 IT 部门成员账号
- M2 已经有至少 3 个客户记录

## 场景 1：会议创建 + 议程模板自动填充（T3.01 + T3.02）
1. 用 sales 账号创建 meeting
2. customer 选 M2 的"日本测试商社"
3. type = Zoom，scheduled_at = 明天 14:00
4. agenda_template 选"初次介绍"
5. 不填 agenda 字段
6. 保存
- 期望：
  - [ ] meeting_no 自动生成 `MEET-YYYYMMDD-001`
  - [ ] 保存后 agenda 字段自动填入"初次介绍"模板的全部内容
  - [ ] 默认 status = scheduled

## 场景 2：议程模板不覆盖已填内容
1. 创建 meeting，agenda_template = "需求确认"
2. 手动填 agenda = "测试内容"
3. 保存
- 期望：
  - [ ] agenda 字段保留"测试内容"，不被模板覆盖

## 场景 3：会议日历视图（T3.03）
1. 进入 meeting 列表 → 日历视图
- 期望：
  - [ ] 当前月份能看到所有 meeting
  - [ ] 不同 type 显示不同颜色
  - [ ] 周/日切换正常

## 场景 4：24h 提醒（T3.04）
1. 创建 meeting，scheduled_at = 24h 后
2. 等定时任务跑（或手动触发工作流 A）
- 期望：
  - [ ] 内部参与人收到站内信
  - [ ] 外部参与人收到 `meeting-reminder-zh/en/ja`（按 customer.country 路由）
  - [ ] reminder_24h_sent 字段变 true
  - [ ] 重复跑工作流不会再次发送（幂等）

## 场景 5：工厂参观 IT 通知（T3.05）
1. 创建 meeting，type = "工厂参观（视频）"
2. 保存
- 期望：
  - [ ] IT 部门收到任务 "[MEET-xxx] 测试视频/网络/Zoom"
  - [ ] 任务 due 时间 = 会议时间 - 24h

## 场景 6：会议纪要 + 决策人到场（T4.01）
1. 进入某个 meeting 详情
2. 添加一条 meeting_notes
3. discussion_points 填若干要点；decision_maker_present = true；next_steps 填行动项
4. 上传 1 张照片到 attachments
5. 保存
- 期望：
  - [ ] 一个 meeting 可以有多条 notes
  - [ ] attachments 能预览/下载

## 场景 7：销售资料 block（T4.02）
1. 在 meeting 详情页右侧添加列表块（按手动清单）
2. 配置筛选 is_public = true
- 期望：
  - [ ] 看到 9 条公开资料（10 条 seed 中 1 条客户案例 is_public=false 不显示）
  - [ ] 按 asset_type 分组
  - [ ] 客户语言为日本时 ja 资料置顶（如配置了排序规则）

## 场景 8：会议完成回写 customer（T4.03）
1. 把场景 1 的 meeting status 改为 completed
2. outcome 设为 positive
3. 保存
- 期望：
  - [ ] 打开关联的 customer "日本测试商社"
  - [ ] customer.first_meeting_at 自动 = meeting.scheduled_at
  - [ ] customer.first_meeting_outcome = positive
  - [ ] customer.last_contact_at 更新为当前时间

## 场景 9：多次会议不覆盖首次会议时间（T4.03）
1. 给同一个 customer 完成第二个 meeting
2. 保存
- 期望：
  - [ ] customer.first_meeting_at 保持第一次会议时间（不被覆盖）
  - [ ] customer.last_contact_at 更新为最新

## 场景 10：会后跟进任务（T4.04）
1. 完成场景 1 的 meeting
- 期望：
  - [ ] sales（owner）收到任务 "[{{customer.company_name}}] 会后跟进邮件"
  - [ ] due = now + 24h

## 验收勾选
- [ ] 场景 1 通过
- [ ] 场景 2 通过
- [ ] 场景 3 通过
- [ ] 场景 4 通过
- [ ] 场景 5 通过
- [ ] 场景 6 通过
- [ ] 场景 7 通过
- [ ] 场景 8 通过
- [ ] 场景 9 通过
- [ ] 场景 10 通过

## 已知缺陷与未覆盖项

- 完整工作流（24h/1h 提醒、IT 通知、24h 跟进）依赖 UI 手动配置或导入 JSON；插件代码本身不强制此部分
- meeting_no 自动编号需 `plugin-field-sequence` 启用，否则 fallback 为空字符串
- 销售资料语言过滤（按客户语言路由）需在 list block 配置时按 customer 上下文加 filter
