/**
 * Better Bags NocoCRM ACL - Server Plugin
 *
 * 职责（M15）：
 *   1. 安装 9 个角色（T15.01）
 *   2. 注册 4 类数据隔离 addFixedParams（T15.02 - T15.05）
 *   3. 注册角色基础 allow 规则（来自 roles.ts 的 allow 数组）
 *
 * 注：所有跨表 hook（M5-M14 实施的）使用 `hooks: false` 或内部 repo 调用，
 *     原则上不受 ACL 影响，确保业务自动化不被权限阻断。
 */

import { Plugin } from '@nocobase/server';
import {
  buildCostEstimateFieldScope,
  buildCustomerFinanceFieldScope,
  buildOrdersScope,
  buildOwnerScope,
  buildProductionFactoryScope,
} from './dataScopes';
import { ROLES } from './roles';

const OWNER_SCOPED_RESOURCES = ['customers', 'inquiries', 'quotations'];
const FACTORY_SCOPED_RESOURCES = ['production_plans', 'production_progress', 'qc_reports'];

export class PluginNocoCRMACLServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {}

  async load() {
    this.registerRoles();
    this.registerDataScopes();
  }

  // ====================================================================
  // T15.01 注册 9 个角色 + 各自 allow 规则
  // ====================================================================
  private registerRoles() {
    for (const role of ROLES) {
      try {
        // 1. 注册角色策略（如果已存在则不覆盖）
        this.app.acl.define({
          role: role.name,
          strategy: role.strategy,
        });

        // 2. 注册角色的资源动作 allow
        if (role.allow) {
          for (const { resource, actions } of role.allow) {
            if (resource === '*') {
              // readonly：使用 strategy actions=['view'] 表达，全表只读
              continue;
            }
            for (const action of actions) {
              this.app.acl.allow(resource, action, role.name);
            }
          }
        }
      } catch (err) {
        console.error(`[nococrm-acl] register role ${role.name} failed:`, err);
      }
    }
  }

  // ====================================================================
  // T15.02 - T15.05 数据隔离与字段级隔离
  // ====================================================================
  private registerDataScopes() {
    // T15.02 customers / inquiries / quotations 业务员 owner 隔离
    for (const resource of OWNER_SCOPED_RESOURCES) {
      const scope = buildOwnerScope(resource);
      ['list', 'get'].forEach((action) => {
        this.app.acl.addFixedParams(resource, action, scope as any);
      });
    }

    // T15.04 + sales owner 双重隔离：orders
    const ordersScope = buildOrdersScope();
    ['list', 'get'].forEach((action) => {
      this.app.acl.addFixedParams('orders', action, ordersScope as any);
    });

    // T15.04 production_plans / qc_reports / production_progress 工厂隔离
    const productionScope = buildProductionFactoryScope();
    for (const resource of FACTORY_SCOPED_RESOURCES) {
      ['list', 'get'].forEach((action) => {
        this.app.acl.addFixedParams(resource, action, productionScope as any);
      });
    }

    // T15.03 customers 财务字段隔离
    const customerFinanceScope = buildCustomerFinanceFieldScope();
    ['list', 'get'].forEach((action) => {
      this.app.acl.addFixedParams('customers', action, customerFinanceScope as any);
    });

    // T15.05 cost_estimates sales 字段隔离
    const costScope = buildCostEstimateFieldScope();
    ['list', 'get'].forEach((action) => {
      this.app.acl.addFixedParams('cost_estimates', action, costScope as any);
    });
  }

  // ====================================================================
  // 启用插件时通过 roles repo 插入 9 个角色（如不存在）
  // ====================================================================
  async install() {
    await this.upsertRoles();
  }

  async afterEnable() {
    await this.upsertRoles();
  }

  private async upsertRoles() {
    try {
      const rolesRepo = this.db.getRepository('roles');
      if (!rolesRepo) return;
      for (const role of ROLES) {
        const existing = await rolesRepo.findOne({ filter: { name: role.name } });
        if (existing) continue;
        await rolesRepo.create({
          values: {
            name: role.name,
            title: role.title,
            description: role.description,
            strategy: role.strategy,
            allowConfigure: role.name === 'admin',
          },
        });
      }
    } catch (err) {
      console.error('[nococrm-acl] upsertRoles failed:', err);
    }
  }

  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMACLServer;
