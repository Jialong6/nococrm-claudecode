import { Plugin } from '@nocobase/client';

export class PluginNocoCRMFulfillmentClient extends Plugin {
  async load() {
    // M11/M12 不注册自定义组件；
    // 生产 / 质检 / 发货跟踪 看板依赖 NocoBase 内置 plugin-kanban
  }
}

export default PluginNocoCRMFulfillmentClient;
