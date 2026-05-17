/**
 * T8.01 + T8.02 谈判记录 negotiations
 * Hooks（见 plugin.ts）：
 *   - beforeCreate：customer 从 quotation 自动同步 / round_no 自动 = 上一轮 + 1 / occurred_at 默认 now
 *   - afterSave：count ≥ 5 → 触发止损（写 quotation.pending_approval_reason）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'negotiations',
  title: '谈判记录',
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
      name: 'quotation',
      target: 'quotations',
      foreignKey: 'quotation_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '报价',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'quotation_no', value: 'id' } },
        required: true,
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
        description: '从 quotation 自动同步',
      },
    },
    {
      type: 'integer',
      name: 'round_no',
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '谈判轮次',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1 },
        description: '不填则自动 = 上一轮 + 1；≥ 5 触发止损评估',
      },
    },
    {
      type: 'date',
      name: 'occurred_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '发生时间',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: true },
      },
    },
    {
      type: 'array',
      name: 'customer_concerns',
      interface: 'checkboxGroup',
      uiSchema: {
        type: 'array',
        title: '客户关切',
        'x-component': 'Checkbox.Group',
        enum: [
          { value: 'price', label: '价格' },
          { value: 'lead_time', label: '交期' },
          { value: 'payment', label: '付款' },
          { value: 'material', label: '材料' },
          { value: 'quantity', label: '数量' },
          { value: 'moq', label: 'MOQ' },
          { value: 'packaging', label: '包装' },
          { value: 'other', label: '其他' },
        ],
      },
    },
    {
      type: 'text',
      name: 'concern_detail',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '关切描述', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'text',
      name: 'our_response',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '我方回应', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'string',
      name: 'concession_type',
      interface: 'radioGroup',
      defaultValue: 'no_concession',
      uiSchema: {
        type: 'string',
        title: '让步类型',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'tiered_discount', label: '阶梯折扣' },
          { value: 'material_swap', label: '材料调整' },
          { value: 'split_shipment', label: '分批发货' },
          { value: 'payment_delay', label: '付款延期' },
          { value: 'quantity_flex', label: '数量弹性' },
          { value: 'no_concession', label: '无让步' },
        ],
      },
    },
    {
      type: 'text',
      name: 'concession_value',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '让步内容',
        'x-component': 'Input.TextArea',
        description: '自由文本，如 "1000-2999 件 5%，3000+ 件 8%"',
      },
    },
    {
      type: 'decimal',
      name: 'concession_discount_pct',
      defaultValue: 0,
      interface: 'percent',
      uiSchema: {
        type: 'number',
        title: '让步折扣率（%）',
        'x-component': 'Percent',
        'x-component-props': { precision: 2 },
        description: '用于在报价/客户层级累计本次让步幅度',
      },
    },
    {
      type: 'string',
      name: 'outcome',
      interface: 'radioGroup',
      defaultValue: 'continue',
      uiSchema: {
        type: 'string',
        title: '本轮结果',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'continue', label: '继续', color: 'blue' },
          { value: 'agreed', label: '达成', color: 'green' },
          { value: 'stuck', label: '僵局', color: 'gold' },
          { value: 'cancelled', label: '客户取消', color: 'red' },
        ],
      },
    },
    {
      type: 'text',
      name: 'next_action',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '下一步',
        'x-component': 'Input.TextArea',
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
