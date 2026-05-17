/**
 * Better Bags NocoCRM Reports - Server Plugin
 *
 * 职责（M16）：注册 7 个 resource action 聚合数据源，供 UI chart block 调用。
 *
 * 7 个 actions：
 *   - customers:funnelStats           T16.01 13 阶段漏斗
 *   - orders:salesPerformance         T16.02 销售业绩
 *   - factories:capacityUtilization   T16.03 工厂产能
 *   - samples:conversionRate          T16.04 打样转化
 *   - customers:statusDuration        T16.05 阶段停留时长
 *   - customers:priorityDistribution  T16.06 A/B/C/D 分布
 *   - payments:cashFlow               T16.07 现金流
 */

import { Plugin } from '@nocobase/server';
import capacityUtilization from './actions/capacityUtilization';
import cashFlow from './actions/cashFlow';
import funnelStats from './actions/funnelStats';
import priorityDistribution from './actions/priorityDistribution';
import salesPerformance from './actions/salesPerformance';
import samplesConversion from './actions/samplesConversion';
import statusDuration from './actions/statusDuration';

const REPORT_ACTIONS: Record<string, any> = {
  'customers:funnelStats': funnelStats,
  'orders:salesPerformance': salesPerformance,
  'factories:capacityUtilization': capacityUtilization,
  'samples:conversionRate': samplesConversion,
  'customers:statusDuration': statusDuration,
  'customers:priorityDistribution': priorityDistribution,
  'payments:cashFlow': cashFlow,
};

const REPORT_ALLOW_LIST: Array<{ resource: string; actions: string[] }> = [
  { resource: 'customers', actions: ['funnelStats', 'statusDuration', 'priorityDistribution'] },
  { resource: 'orders', actions: ['salesPerformance'] },
  { resource: 'factories', actions: ['capacityUtilization'] },
  { resource: 'samples', actions: ['conversionRate'] },
  { resource: 'payments', actions: ['cashFlow'] },
];

export class PluginNocoCRMReportsServer extends Plugin {
  async afterAdd() {}

  beforeLoad() {}

  async load() {
    // 注册 7 个 action handler
    Object.entries(REPORT_ACTIONS).forEach(([key, handler]) => {
      this.app.resourceManager.registerActionHandler(key, handler);
    });

    // ACL：所有登录用户可调用聚合 action
    // 注：M15 的字段隔离不会限制 action 返回的聚合数据；
    //     如果业务上需要更细粒度（如 sales 只看自己 owner 的聚合），需在 action 内部按 ctx.state.currentUser 过滤
    for (const { resource, actions } of REPORT_ALLOW_LIST) {
      for (const action of actions) {
        this.app.acl.allow(resource, action, 'loggedIn');
      }
    }

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: Object.keys(REPORT_ACTIONS),
    });
  }

  async install() {}
  async afterEnable() {}
  async afterDisable() {}
  async remove() {}
}

export default PluginNocoCRMReportsServer;
