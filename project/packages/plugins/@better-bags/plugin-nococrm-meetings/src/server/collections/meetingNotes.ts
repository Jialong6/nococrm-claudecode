/**
 * T4.01 会议纪要 meeting_notes
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'meeting_notes',
  title: '会议纪要',
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
      type: 'belongsTo',
      name: 'meeting',
      target: 'meetings',
      foreignKey: 'meeting_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '会议',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'meeting_no', value: 'id' } },
        required: true,
      },
    },
    {
      type: 'text',
      name: 'discussion_points',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '沟通要点',
        'x-component': 'Markdown',
        description: '客户提出的问题、我方介绍的内容、达成的共识',
      },
    },
    {
      type: 'text',
      name: 'pain_points',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '客户痛点',
        'x-component': 'Input.TextArea',
        description: '当前供应链 / 品质 / 交期 / 价格的痛点',
      },
    },
    {
      type: 'boolean',
      name: 'decision_maker_present',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '决策人到场',
        'x-component': 'Checkbox',
        description: '影响后续推进策略',
      },
    },
    {
      type: 'text',
      name: 'next_steps',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '下一步行动',
        'x-component': 'Markdown',
        description: '负责人 / 截止时间 / 交付物',
      },
    },
    {
      type: 'attachment',
      name: 'attachments',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '附件',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: true },
      },
    },
  ],
});
