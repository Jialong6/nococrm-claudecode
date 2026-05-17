import { Plugin } from '@nocobase/client';

export class PluginNocoCRMCoreClient extends Plugin {
  async load() {
    // M1/M2 阶段无自定义 UI 组件，所有 collection 走 NocoBase 默认渲染。
    // 后续里程碑 (M6/M16) 才会注册自定义 block / chart。
  }
}

export default PluginNocoCRMCoreClient;
