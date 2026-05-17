# @better-bags/plugin-nococrm-acl

Better Bags NocoCRM 权限与角色插件 — **M15 全局横向：权限与 ACL** 的实现。

## 这是什么

按 [`tasks.md`](../../../../../../tasks.md) M15 共 **6 个任务**定义 9 个业务角色 + 4 类数据隔离规则。本插件不创建 collection，仅注册 ACL 策略。

启用后：

- 自动创建 9 个角色（如已存在则跳过）：admin / sales_manager / sales / finance / factory_qd / factory_ygn / qc / procurement / readonly
- **4 类数据隔离**（addFixedParams 注入）：
  1. T15.02 业务员（sales）：customers / inquiries / quotations 仅 owner=self
  2. T15.03 财务（finance）：customers 联系方式字段（phone/email/wechat/whatsapp）排除
  3. T15.04 工厂（factory_qd / factory_ygn）：orders / production_plans / qc_reports / production_progress 按 production_factory.code 过滤
  4. T15.05 业务员（sales）：cost_estimates 排除 cost_*/margin_*/overhead/logistics_cost 字段

## 依赖

- `plugin-nococrm-core`（customers / factories 字段）
- `plugin-nococrm-quotation`（cost_estimates）
- `plugin-nococrm-orders`（orders / production_plans）
- `plugin-nococrm-fulfillment`（qc_reports / production_progress）

## 启用步骤

```bash
cd project && yarn install && yarn dev
# 浏览器进 http://localhost:13000 → 插件管理 → "NocoCRM 权限与角色" → 启用
```

启用后访问"权限管理 → 角色"应该看到 9 个新角色。

## 角色 × 资源 权限矩阵

| 角色 | customers | inquiries | quotations | cost_estimates | orders | payments | production_plans | qc_reports | materials | samples |
|------|-----------|-----------|------------|----------------|--------|----------|------------------|------------|-----------|---------|
| admin | RWCD | RWCD | RWCD | RWCD | RWCD | RWCD | RWCD | RWCD | RWCD | RWCD |
| sales_manager | RWC | RWC | RWC | RWC | RW | - | - | - | - | - |
| sales | RWC (owner=self) | RWC | RWC | R (只读 final_price) | R | - | - | - | - | RWC |
| finance | R (无联系方式) | - | - | R | R | RWC | - | - | - | - |
| factory_qd | - | - | - | - | RW (CN_*) | - | RW (CN_*) | RWC (CN_*) | R | RW |
| factory_ygn | - | - | - | - | RW (MM_YGN) | - | RW (MM_YGN) | RWC (MM_YGN) | R | - |
| qc | - | - | - | - | R | - | R | RWC | - | R |
| procurement | - | - | - | - | R | - | R | - | RWC | - |
| readonly | R | R | R | R | R | R | R | R | R | R |

> R=read（list/get）, W=update, C=create, D=destroy；括号内为数据范围隔离

## 业务红线对应

| 红线 | 来源 | 实现位置 |
|------|------|---------|
| 业务员只能看自己客户（防内部抢单） | SOP 阶段 1 | T15.02 `buildOwnerScope` |
| 财务看不到客户联系方式 | 隐私 + 合规 | T15.03 `buildCustomerFinanceFieldScope` |
| 工厂之间互不可见 | 商业机密 | T15.04 `buildOrdersScope` + `buildProductionFactoryScope` |
| 业务员看不到成本 / 利润率（防泄密） | 03 知识库 价格红线 | T15.05 `buildCostEstimateFieldScope` |

## 故障排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 启用后角色没出现 | install/afterEnable 失败 | 查日志 `[nococrm-acl] upsertRoles failed` |
| admin 也看不到数据 | NocoBase 默认 root 角色策略冲突 | admin 不要被 addFixedParams 影响；scope 函数检查 ctx.state.currentRole |
| sales 能看到所有客户 | currentRole 未生效 | 用户没被分配 sales 角色，或者其角色优先级高于 sales |
| 业务员看 cost_estimate 还是有 cost 字段 | NocoBase 字段级 fixedParams 仅在 list/get 生效；详情页可能绕过 | 在 UI 字段权限再叠加一层（角色管理 → 字段权限） |
| factory_qd 仍然能看到 MM_YGN 订单 | orders.production_factory 关联未加载 | 检查 collection 关系字段；用 m2o `production_factory` 而非 fk `production_factory_id` |

## 手动配置补充

ACL 中部分能力 NocoBase 强制走 UI（无法代码注入）：

### 1. 分配用户到角色
- 路径：用户管理 → 选用户 → 角色 → 勾选
- 一个用户可有多个角色，但 ACL 取并集（最宽松）

### 2. 部门关联（结合 plugin-departments）
- 销售经理本部门客户范围：UI 中给 sales_manager 角色配 dataRules
- 关联 user.department + customer.department 过滤

### 3. 字段权限细化
- 路径：角色管理 → 选角色 → 字段权限
- 示例：sales 角色 cost_estimates 字段权限 = 仅 id / inquiry_id / final_price / status

## 目录结构

```text
plugin-nococrm-acl/
├── package.json
├── server.js / server.d.ts
├── client.js / client.d.ts
├── README.md
├── src/
│   ├── index.ts
│   ├── client/index.tsx
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts                       # 注册角色 + ACL allow + 数据隔离
│   │   ├── roles.ts                        # 9 个角色定义
│   │   └── dataScopes.ts                   # 4 类隔离 scope 工厂函数
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
└── tests/
    └── m15-permission-matrix.md
```

## License

AGPL-3.0
