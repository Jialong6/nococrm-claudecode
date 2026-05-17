/**
 * T7.04 跟进话术模板 followup_scripts
 * 4 场景 × 3 语 = 12 条预置（在 seed migration 中灌入）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'followup_scripts',
  title: '跟进话术',
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
      name: 'scenario',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '场景',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'decision_check', label: '决策进展询问', color: 'blue' },
          { value: 'new_case', label: '提供新案例', color: 'cyan' },
          { value: 'tech_support', label: '技术补充', color: 'gold' },
          { value: 'greeting', label: '节日问候', color: 'green' },
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
      name: 'subject',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '邮件主题',
        'x-component': 'Input',
        description: '支持 {{customer.company_name}} 等变量',
      },
    },
    {
      type: 'text',
      name: 'body',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '邮件正文',
        'x-component': 'Markdown',
        description: '支持变量 {{customer.primary_contact}} {{customer.company_name}} {{quotation.quotation_no}} {{user.nickname}}',
      },
    },
    {
      type: 'string',
      name: 'applicable_priority',
      interface: 'input',
      defaultValue: 'A,B,C,D',
      uiSchema: {
        type: 'string',
        title: '适用客户等级',
        'x-component': 'Input',
        description: '逗号分隔，如 A,B 或 A,B,C,D',
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
