/**
 * T11.01 生产进度 production_progress
 * Hooks（见 plugin.ts）：
 *   - beforeSave：order 从 production_plan 自动同步；cumulative_qty 自动 = 前置进度之和 + 本次
 *   - afterCreate (T11.04)：issues 非空 → 写 order.notes 追加 [PROD_ISSUE] 标记
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'production_progress',
  title: '生产进度',
  shared: true,
  sortable: true,
  createdBy: true,
  updatedBy: true,
  logging: true,
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
      name: 'production_plan',
      target: 'production_plans',
      foreignKey: 'production_plan_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '排产计划',
        'x-component': 'AssociationField',
        required: true,
      },
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
        description: '从 production_plan 自动同步',
      },
    },
    {
      type: 'date',
      name: 'date',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '报告日期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        required: true,
      },
    },
    {
      type: 'integer',
      name: 'completed_qty',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '当日完工',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
    },
    {
      type: 'integer',
      name: 'cumulative_qty',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '累计完工',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
        description: 'hook 自动计算 = 该 plan 之前所有 completed_qty 之和 + 本次',
      },
    },
    {
      type: 'attachment',
      name: 'photos',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '进度照片',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: true },
      },
    },
    {
      type: 'text',
      name: 'issues',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '异常',
        'x-component': 'Input.TextArea',
        description: '填写后自动通知业务员（hook 写 order.notes）',
      },
    },
    {
      type: 'belongsTo',
      name: 'reported_by',
      target: 'users',
      foreignKey: 'reported_by_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '报告人',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'nickname', value: 'id' } },
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
