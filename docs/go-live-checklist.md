# NocoCRM 上线检查清单（T17.02 + 总检查）

上线当天逐项勾选。任何 P0 项不通过则不上线。

## 一、环境准备（P0）

- [ ] 服务器规格达标（≥ 4C8G）
- [ ] Docker 24+ / Compose v2 已装
- [ ] 域名已解析，80/443 开放
- [ ] `deploy/.env.production` 已填（APP_KEY / DB_PASSWORD / SMTP / OPS_ALERT_EMAIL）
- [ ] HTTPS 证书已申请（certbot），nginx conf 域名已改
- [ ] certbot 自动续期已配置

## 二、数据库与迁移（P0）

- [ ] postgres + redis 容器健康
- [ ] `yarn nocobase install`（首次）或 `upgrade`（升级）成功
- [ ] 10 个插件按依赖顺序全部启用：
  - [ ] core → meetings → quotation → followup → orders → fulfillment → retention → acl → reports → ops
- [ ] 字典 seed 数据就位（工厂 3 / 品类 6 / 地区 20 / 币种 7 / 来源 11 / 议程 5 / 资料 10 / 话术 24）

## 三、权限矩阵全量测试（P0，T17.02）

逐一执行 `project/packages/plugins/@better-bags/plugin-nococrm-acl/tests/m15-permission-matrix.md` 的 21 个场景：

- [ ] 业务员数据隔离（场景 1-4）
- [ ] 财务字段隔离（场景 5-8）
- [ ] 工厂数据隔离（场景 9-12）
- [ ] 敏感字段隔离（场景 13-15）
- [ ] 基础 allow（场景 16-19）
- [ ] 角色组合（场景 20-21）

## 四、端到端验收（P0，T17.01）

- [ ] 执行 `docs/e2e-acceptance.md` 全部勾选项
- [ ] 13 阶段无中断
- [ ] 6 大业务红线生效

## 五、通知与告警（P0）

- [ ] SMTP 测试邮件发送成功
- [ ] `ops:testAlert` 三渠道收到
- [ ] 关键工作流（尾款催收/排产通知）失败分支已配 ops:sendAlert

## 六、备份（P0，T17.03）

- [ ] `bash deploy/backup.sh` 手动跑通，生成 .dump
- [ ] crontab 每日 2 点自动备份已配
- [ ] 异地备份（S3）验证（如启用）
- [ ] 还原演练成功（测试库）
- [ ] **上线前做一次基线快照**

## 七、性能与稳定性（P1）

- [ ] CLUSTER_MODE=2 多核生效
- [ ] 健康检查 healthcheck 通过
- [ ] 日志 dailyRotateFile 正常切割
- [ ] 负载测试（可选）：50 并发无超时

## 八、文档与培训（P0，T17.04）

- [ ] 培训手册 5 章已交付
- [ ] 5 段录屏已录制（或分镜脚本已交付）
- [ ] 各岗位关键人已培训

## 九、回滚预案（P0）

- [ ] 上线前 git tag 标记稳定版本
- [ ] 上线前数据库快照已存
- [ ] 回滚步骤已演练（见 deploy/README.md）

## 上线决策

- [ ] 所有 P0 项通过
- [ ] 风险项已知会干系人

**上线负责人**：____________  **批准人**：____________  **日期**：____________
