import { Plugin } from '@nocobase/client';

export class PluginNocoCRMMeetingsClient extends Plugin {
  async load() {
    // M3/M4 阶段不注册自定义 block；销售资料 block 走 NocoBase 内置 list block。
    // 会议日历视图依赖 @nocobase/plugin-calendar 内置组件。
  }
}

export default PluginNocoCRMMeetingsClient;
