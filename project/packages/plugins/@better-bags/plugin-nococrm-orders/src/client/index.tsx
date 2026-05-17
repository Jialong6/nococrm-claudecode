import { Plugin } from '@nocobase/client';

export class PluginNocoCRMOrdersClient extends Plugin {
  async load() {
    // M9/M10 不注册自定义组件；
    // 订单 Kanban / 付款看板 / 排产甘特图 依赖 NocoBase 内置插件
  }
}

export default PluginNocoCRMOrdersClient;
