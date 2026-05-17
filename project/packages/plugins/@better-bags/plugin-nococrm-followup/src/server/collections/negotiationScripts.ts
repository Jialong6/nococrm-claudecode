/**
 * T8.05 谈判应对话术库 negotiation_scripts
 * 4 类客户关切 × 3 语 = 12 条预置（在 seed migration 中灌入）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'negotiation_scripts',
  title: '谈判话术',
  shared: true,
  sortable: true,
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'integer',
    },
    {
      type: 'string',
      name: 'concern_category',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '客户关切类别',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'price', label: '价格', color: 'red' },
          { value: 'lead_time', label: '交期', color: 'gold' },
          { value: 'payment', label: '付款', color: 'blue' },
          { value: 'material', label: '材料', color: 'cyan' },
          { value: 'quantity', label: '数量', color: 'purple' },
          { value: 'moq', label: 'MOQ', color: 'magenta' },
          { value: 'packaging', label: '包装', color: 'default' },
          { value: 'other', label: '其他', color: 'default' },
        ],
      },
    },
    {
      type: 'string',
      name: 'language',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '语言',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'zh', label: '中文' },
          { value: 'en', label: '英文' },
          { value: 'ja', label: '日文' },
        ],
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: '话术标题', 'x-component': 'Input', required: true },
    },
    {
      type: 'text',
      name: 'body',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '话术正文',
        'x-component': 'Markdown',
        description: '结构：先共情 → 提供数据/价值主张 → 提出双赢方案',
      },
    },
    {
      type: 'integer',
      name: 'sort_order',
      defaultValue: 100,
      interface: 'integer',
      uiSchema: { type: 'number', title: '排序', 'x-component': 'InputNumber' },
    },
    {
      type: 'boolean',
      name: 'is_active',
      defaultValue: true,
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: '启用', 'x-component': 'Checkbox' },
    },
  ],
});
