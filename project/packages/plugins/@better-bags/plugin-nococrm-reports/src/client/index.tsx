import { Plugin } from '@nocobase/client';

export class PluginNocoCRMReportsClient extends Plugin {
  async load() {
    // M16 后端聚合 action，UI chart block 直接调用，无自定义客户端组件
  }
}

export default PluginNocoCRMReportsClient;
