/**
 * T13.01 交付反馈 delivery_feedback
 * Hook 行为：
 *   - beforeCreate：从 shipment 自动同步 order / customer
 *   - afterSave：satisfaction_score ≤ 2 → customer.risk_flag=true + order.notes 追加 [LOW_SATISFACTION]
 *                satisfaction_score ≥ 4 → customer.risk_flag=false（自动消除）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'delivery_feedback',
  title: '交付反馈',
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
      name: 'shipment',
      target: 'shipments',
      foreignKey: 'shipment_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '发货',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'shipment_no', value: 'id' } },
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
        description: 'hook 从 shipment 自动同步',
      },
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
        description: 'hook 从 order 自动同步',
      },
    },
    {
      type: 'date',
      name: 'received_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '客户收到日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'integer',
      name: 'satisfaction_score',
      interface: 'radioGroup',
      uiSchema: {
        type: 'number',
        title: '满意度评分',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 1, label: '1 星 - 非常不满', color: 'red' },
          { value: 2, label: '2 星 - 不满', color: 'orange' },
          { value: 3, label: '3 星 - 一般', color: 'gold' },
          { value: 4, label: '4 星 - 满意', color: 'green' },
          { value: 5, label: '5 星 - 非常满意', color: 'lime' },
        ],
        description: '≤ 2 触发补救工作流；≥ 4 自动清除 risk_flag',
      },
    },
    {
      type: 'text',
      name: 'quality_issues',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '质量问题', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'text',
      name: 'logistics_issues',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '物流问题', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'text',
      name: 'service_issues',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '服务问题', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'text',
      name: 'suggestions',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '建议', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'boolean',
      name: 'would_reorder',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '愿意复购',
        'x-component': 'Checkbox',
      },
    },
    {
      type: 'string',
      name: 'collected_via',
      defaultValue: 'email',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '收集方式',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'email', label: '邮件' },
          { value: 'phone', label: '电话' },
          { value: 'online_form', label: '在线问卷' },
          { value: 'on_site', label: '现场' },
        ],
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
