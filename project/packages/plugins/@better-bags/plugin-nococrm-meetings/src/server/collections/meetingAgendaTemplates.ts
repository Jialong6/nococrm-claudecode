/**
 * T3.02 议程模板 meeting_agenda_templates
 * 5 种预置：初次介绍 / 需求确认 / 工厂参观 / 报价讨论 / 大货前确认
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'meeting_agenda_templates',
  title: '议程模板',
  shared: true,
  sortable: true,
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
      name: 'name',
      unique: true,
      interface: 'input',
      uiSchema: { type: 'string', title: '模板名', 'x-component': 'Input', required: true },
    },
    {
      type: 'string',
      name: 'description',
      interface: 'input',
      uiSchema: { type: 'string', title: '描述', 'x-component': 'Input' },
    },
    {
      type: 'text',
      name: 'body',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '模板内容',
        'x-component': 'Markdown',
        description: '会议创建时被复制到 meeting.agenda 字段',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'applicable_type',
      interface: 'radioGroup',
      defaultValue: 'all',
      uiSchema: {
        type: 'string',
        title: '适用类型',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'all', label: '所有' },
          { value: 'zoom', label: 'Zoom' },
          { value: 'teams', label: 'Teams' },
          { value: 'phone', label: '电话' },
          { value: 'tour', label: '工厂参观' },
        ],
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
