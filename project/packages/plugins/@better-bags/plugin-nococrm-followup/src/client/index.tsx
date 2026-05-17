import { Plugin } from '@nocobase/client';

export class PluginNocoCRMFollowupClient extends Plugin {
  async load() {
    // M7/M8 不注册自定义客户端组件；
    // 谈判时间线视图依赖 NocoBase 内置 plugin-block-list
  }
}

export default PluginNocoCRMFollowupClient;
