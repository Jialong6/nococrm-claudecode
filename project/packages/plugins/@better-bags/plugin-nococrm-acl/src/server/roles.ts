/**
 * T15.01 9 个角色定义
 * 启用本插件时，install/afterEnable 会通过 db.getRepository('roles') 注入这些角色（如已存在则跳过）。
 */

export const SENSITIVE_CUSTOMER_FIELDS = ['phone', 'email', 'wechat', 'whatsapp'];
export const SENSITIVE_COST_FIELDS = ['material_cost', 'labor_cost', 'overhead', 'logistics_cost', 'margin_rate', 'margin_value'];

export interface RoleDefinition {
  name: string;
  title: string;
  description: string;
  strategy: {
    actions?: string[];
  };
  /** 角色级元数据，不直接传给 acl.define */
  responsibilities: string;
  /** 可创建/写入的资源（资源:动作 列表） */
  allow?: Array<{ resource: string; actions: string[] }>;
}

export const ROLES: RoleDefinition[] = [
  {
    name: 'admin',
    title: '超级管理员',
    description: 'NocoBase 默认 root 角色，所有表全权限',
    strategy: { actions: ['*'] },
    responsibilities: '系统管理 / 数据修复 / 角色分配',
  },
  {
    name: 'sales_manager',
    title: '销售经理',
    description: '本部门客户读写 + 报价审批 + 谈判止损 + cost_estimates 全权',
    strategy: { actions: ['view', 'create', 'update', 'destroy'] },
    responsibilities: '审批价格底线 / 谈判止损评估 / 业务员管理',
    allow: [
      { resource: 'customers', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'inquiries', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'quotations', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'cost_estimates', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'negotiations', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'orders', actions: ['list', 'get', 'update'] },
      { resource: 'contracts', actions: ['list', 'get', 'create', 'update'] },
    ],
  },
  {
    name: 'sales',
    title: '业务员',
    description: '仅自己负责（owner=self）的 customers / inquiries / quotations / orders',
    strategy: { actions: ['view', 'create', 'update'] },
    responsibilities: '客户接洽 / 询盘整理 / 报价 / 跟进',
    allow: [
      { resource: 'customers', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'contacts', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'inquiries', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'quotations', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'cost_estimates', actions: ['list', 'get'] }, // 字段级隔离见 dataScopes
      { resource: 'samples', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'meetings', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'meeting_notes', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'negotiations', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'orders', actions: ['list', 'get'] },
      { resource: 'shipments', actions: ['list', 'get'] },
    ],
  },
  {
    name: 'finance',
    title: '财务',
    description: 'payments 全权 + cost_estimates 全读 + customers 联系方式隐藏',
    strategy: { actions: ['view'] },
    responsibilities: '收款确认 / 尾款催收 / 现金流分析',
    allow: [
      { resource: 'payments', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'cost_estimates', actions: ['list', 'get'] },
      { resource: 'orders', actions: ['list', 'get'] },
      { resource: 'contracts', actions: ['list', 'get'] },
      { resource: 'customers', actions: ['list', 'get'] }, // 字段级隔离：排除联系方式
      { resource: 'shipments', actions: ['list', 'get'] },
    ],
  },
  {
    name: 'factory_qd',
    title: '山东工厂',
    description: 'production_factory ∈ {CN_QD, CN_RZ} 的 orders / production_plans / qc_reports',
    strategy: { actions: ['view', 'update'] },
    responsibilities: '日照大货 + 青岛打样的生产执行',
    allow: [
      { resource: 'orders', actions: ['list', 'get', 'update'] },
      { resource: 'production_plans', actions: ['list', 'get', 'update'] },
      { resource: 'production_progress', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'qc_reports', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'materials', actions: ['list', 'get'] },
      { resource: 'samples', actions: ['list', 'get', 'update'] },
    ],
  },
  {
    name: 'factory_ygn',
    title: '缅甸工厂',
    description: 'production_factory = MM_YGN 的 orders / production_plans / qc_reports',
    strategy: { actions: ['view', 'update'] },
    responsibilities: '缅甸大货生产执行',
    allow: [
      { resource: 'orders', actions: ['list', 'get', 'update'] },
      { resource: 'production_plans', actions: ['list', 'get', 'update'] },
      { resource: 'production_progress', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'qc_reports', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'materials', actions: ['list', 'get'] },
    ],
  },
  {
    name: 'qc',
    title: '质检',
    description: 'qc_reports 全权 + 关联读 orders / production_plans',
    strategy: { actions: ['view', 'create', 'update'] },
    responsibilities: 'AQL 2.5 抽检 / 100% 成品检 / X 线检针 / 客户验厂',
    allow: [
      { resource: 'qc_reports', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'production_plans', actions: ['list', 'get'] },
      { resource: 'production_progress', actions: ['list', 'get'] },
      { resource: 'orders', actions: ['list', 'get'] },
      { resource: 'samples', actions: ['list', 'get'] },
    ],
  },
  {
    name: 'procurement',
    title: '采购',
    description: 'materials 全权 + 关联读 orders',
    strategy: { actions: ['view', 'create', 'update'] },
    responsibilities: '原辅料采购 / 供应商管理 / 拼柜协调',
    allow: [
      { resource: 'materials', actions: ['list', 'get', 'create', 'update'] },
      { resource: 'orders', actions: ['list', 'get'] },
      { resource: 'production_plans', actions: ['list', 'get'] },
    ],
  },
  {
    name: 'readonly',
    title: '只读',
    description: '所有表只读，用于审计 / 实习 / 临时访客',
    strategy: { actions: ['view'] },
    responsibilities: '只读',
    allow: [
      { resource: '*', actions: ['list', 'get'] },
    ],
  },
];
