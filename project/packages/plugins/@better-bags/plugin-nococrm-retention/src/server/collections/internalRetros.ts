/**
 * T13.02 内部复盘 internal_retros
 * 建议每单完结后召开复盘会，参与人 ≥ 3（业务/工厂/QC/物流等）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'internal_retros',
  title: '内部复盘',
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
      name: 'order',
      target: 'orders',
      foreignKey: 'order_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '订单',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'order_no', value: 'id' } },
        required: true,
      },
    },
    {
      type: 'belongsToMany',
      name: 'participants',
      target: 'users',
      through: 'internal_retros_users',
      foreignKey: 'internal_retro_id',
      otherKey: 'user_id',
      interface: 'm2m',
      uiSchema: {
        type: 'array',
        title: '参与人',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'nickname', value: 'id' }, multiple: true },
        description: '建议 ≥ 3 名（业务 + 工厂 + QC）',
      },
    },
    {
      type: 'date',
      name: 'review_date',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '复盘日期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'text',
      name: 'what_went_well',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '做得好的方面',
        'x-component': 'Markdown',
        description: '本订单值得保持的实践',
      },
    },
    {
      type: 'text',
      name: 'what_went_wrong',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '不足之处',
        'x-component': 'Markdown',
        description: '出现的问题与教训',
      },
    },
    {
      type: 'text',
      name: 'improvement_actions',
      interface: 'markdown',
      uiSchema: {
        type: 'string',
        title: '改进措施',
        'x-component': 'Markdown',
        description: '负责人 + 截止时间 + 验收标准',
      },
    },
    {
      type: 'date',
      name: 'next_review_date',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '下次复盘日期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
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
    {
      type: 'text',
      name: 'notes',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '备注', 'x-component': 'Input.TextArea' },
    },
  ],
});
