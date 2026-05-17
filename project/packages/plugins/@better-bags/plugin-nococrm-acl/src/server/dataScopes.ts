/**
 * T15.02 - T15.05 数据隔离规则（注册到 addFixedParams）
 *
 * 4 类数据隔离：
 *   1. 业务员（sales）：customers / inquiries / quotations / orders 仅 owner=self
 *   2. 财务（finance）：customers 联系方式字段排除（fields blacklist）
 *   3. 工厂（factory_qd / factory_ygn）：按 production_factory.code 过滤 orders / production_plans / qc_reports
 *   4. 敏感字段（sales）：cost_estimates 排除 cost_* / margin_* 字段
 */

import { SENSITIVE_COST_FIELDS, SENSITIVE_CUSTOMER_FIELDS } from './roles';

const ORDERS_FACTORY_FILTER: Record<string, { in?: string[]; eq?: string }> = {
  factory_qd: { in: ['CN_QD', 'CN_RZ'] },
  factory_ygn: { eq: 'MM_YGN' },
};

/**
 * customers / inquiries / quotations / orders 数据隔离
 * @param resource collection 名
 */
export function buildOwnerScope(resource: string) {
  return (ctx: any) => {
    const role = ctx?.state?.currentRole;
    const userId = ctx?.state?.currentUser?.id;
    if (role !== 'sales' || !userId) return null;

    // customers 自己持有 owner_id；其他表通过关联 customer 过滤
    if (resource === 'customers') {
      return { filter: { owner_id: userId } };
    }
    return { filter: { 'customer.owner_id': userId } };
  };
}

/**
 * orders 工厂隔离 + sales owner 隔离
 */
export function buildOrdersScope() {
  return (ctx: any) => {
    const role = ctx?.state?.currentRole;
    const userId = ctx?.state?.currentUser?.id;
    if (!role) return null;

    const factoryFilter = ORDERS_FACTORY_FILTER[role];
    if (factoryFilter) {
      if (factoryFilter.in) {
        return { filter: { 'production_factory.code': { $in: factoryFilter.in } } };
      }
      if (factoryFilter.eq) {
        return { filter: { 'production_factory.code': factoryFilter.eq } };
      }
    }
    if (role === 'sales' && userId) {
      return { filter: { 'customer.owner_id': userId } };
    }
    return null;
  };
}

/**
 * production_plans / qc_reports / production_progress 跟随 orders 的工厂隔离
 */
export function buildProductionFactoryScope() {
  return (ctx: any) => {
    const role = ctx?.state?.currentRole;
    if (!role) return null;
    const factoryFilter = ORDERS_FACTORY_FILTER[role];
    if (!factoryFilter) return null;

    if (factoryFilter.in) {
      // production_plans 直接有 factory_id，关联 factories.code
      return { filter: { 'factory.code': { $in: factoryFilter.in } } };
    }
    return { filter: { 'factory.code': factoryFilter.eq } };
  };
}

/**
 * cost_estimates 字段级隔离（T15.05）
 * sales 角色：返回的记录隐藏 SENSITIVE_COST_FIELDS
 *
 * NocoBase 的字段级 ACL 通过 acl.define role params.fields 或 fixedParams.fields 实现。
 * 这里用 fixedParams.fields 的 except 写法。
 */
export function buildCostEstimateFieldScope() {
  return (ctx: any) => {
    const role = ctx?.state?.currentRole;
    if (role !== 'sales') return null;
    return {
      fields: {
        except: SENSITIVE_COST_FIELDS,
      },
    };
  };
}

/**
 * customers 财务字段隔离（T15.03）
 * finance 角色：返回的记录隐藏联系方式字段
 */
export function buildCustomerFinanceFieldScope() {
  return (ctx: any) => {
    const role = ctx?.state?.currentRole;
    if (role !== 'finance') return null;
    return {
      fields: {
        except: SENSITIVE_CUSTOMER_FIELDS,
      },
    };
  };
}
