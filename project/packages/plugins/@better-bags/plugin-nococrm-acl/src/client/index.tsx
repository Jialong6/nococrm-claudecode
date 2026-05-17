import { Plugin } from '@nocobase/client';

export class PluginNocoCRMACLClient extends Plugin {
  async load() {
    // M15 纯后端 ACL，无自定义 UI 组件
  }
}

export default PluginNocoCRMACLClient;
