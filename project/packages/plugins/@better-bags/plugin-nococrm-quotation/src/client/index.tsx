import { Plugin } from '@nocobase/client';

export class PluginNocoCRMQuotationClient extends Plugin {
  async load() {
    // M5/M6 阶段不注册自定义 UI 组件；
    // 报价 Kanban / 样品 Kanban / 询盘 Kanban 依赖 NocoBase 内置 plugin-kanban
    // PDF 打印依赖 plugin-action-print（在 UI 配置 action 时引用 quotation.html 模板）
  }
}

export default PluginNocoCRMQuotationClient;
