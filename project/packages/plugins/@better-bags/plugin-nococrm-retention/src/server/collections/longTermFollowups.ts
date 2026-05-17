/**
 * T14.02 长期跟进 long_term_followups
 * 由 T14.01 季度回访定时工作流自动创建（按 customer.priority 差异化频次）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'long_term_followups',
  title: '长期跟进',
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
      name: 'customer',
      target: 'customers',
      foreignKey: 'customer_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '客户',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'company_name', value: 'id' } },
        required: true,
      },
    },
    {
      type: 'string',
      name: 'type',
      defaultValue: 'quarterly_review',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '类型',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'quarterly_review', label: '季度回访', color: 'blue' },
          { value: 'event_invitation', label: '活动邀请', color: 'gold' },
          { value: 'new_product', label: '新品推荐', color: 'cyan' },
          { value: 'holiday_greeting', label: '节日问候', color: 'green' },
        ],
      },
    },
    {
      type: 'date',
      name: 'scheduled_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '计划时间',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        required: true,
      },
    },
    {
      type: 'date',
      name: 'completed_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '完成时间',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: true },
      },
    },
    {
      type: 'string',
      name: 'outcome',
      defaultValue: 'pending',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '结果',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'pending', label: '待跟进', color: 'default' },
          { value: 'completed', label: '已完成', color: 'green' },
          { value: 'customer_unresponsive', label: '客户未响应', color: 'gold' },
          { value: 'new_opportunity', label: '新机会', color: 'lime' },
        ],
      },
    },
    {
      type: 'date',
      name: 'next_followup_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '下次跟进',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'belongsTo',
      name: 'owner',
      target: 'users',
      foreignKey: 'owner_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '负责人',
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
