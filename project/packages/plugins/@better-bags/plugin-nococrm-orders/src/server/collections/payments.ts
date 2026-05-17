/**
 * T9.03 付款表 payments
 * Hooks（见 plugin.ts）：
 *   - afterUpdate (T9.05)：定金 status = paid → order 解锁 + 自动建尾款 + 建排产记录
 *                          尾款 status = paid → order.balance_paid = true
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'payments',
  title: '付款',
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
      type: 'sequence',
      name: 'payment_no',
      patterns: [
        { type: 'string', options: { value: 'PAY-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: { type: 'string', title: '付款编号', 'x-component': 'Input', 'x-read-pretty': true },
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
      type: 'string',
      name: 'type',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '付款类型',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'deposit', label: '定金', color: 'blue' },
          { value: 'balance', label: '尾款', color: 'cyan' },
          { value: 'interim', label: '中期款', color: 'gold' },
          { value: 'other', label: '其他', color: 'default' },
        ],
      },
    },
    {
      type: 'decimal',
      name: 'amount',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: '金额',
        'x-component': 'InputNumber',
        'x-component-props': { precision: 2, min: 0 },
        required: true,
      },
    },
    {
      type: 'belongsTo',
      name: 'currency',
      target: 'currencies_dict',
      foreignKey: 'currency_code',
      targetKey: 'code',
      interface: 'm2o',
      uiSchema: { type: 'object', title: '币种', 'x-component': 'AssociationField' },
    },
    {
      type: 'decimal',
      name: 'percentage',
      interface: 'percent',
      uiSchema: {
        type: 'number',
        title: '占比（%）',
        'x-component': 'Percent',
        'x-component-props': { precision: 2 },
        description: '行业标准：定金 30 / 尾款 70（来自 06 知识库）',
      },
    },
    {
      type: 'date',
      name: 'due_date',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '应付日期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'date',
      name: 'paid_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '实付日期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: true },
      },
    },
    {
      type: 'attachment',
      name: 'receipt',
      interface: 'attachment',
      uiSchema: { type: 'array', title: '水单 / 凭证', 'x-component': 'Upload.Attachment' },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'unpaid',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'unpaid', label: '未付', color: 'default' },
          { value: 'partial', label: '部分付', color: 'gold' },
          { value: 'paid', label: '已结清', color: 'green' },
          { value: 'overdue', label: '逾期', color: 'red' },
        ],
        description: '定金 paid → 自动建尾款 + 排产；尾款 paid → 订单 balance_paid = true',
      },
    },
    {
      type: 'belongsTo',
      name: 'confirmed_by',
      target: 'users',
      foreignKey: 'confirmed_by_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '财务确认人',
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
