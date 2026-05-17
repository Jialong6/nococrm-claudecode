/**
 * T9.01 合同表 contracts
 * 来源：tasks.md M9
 *
 * 关键行为（见 plugin.ts hook）：
 *   - beforeCreate：customer / total_amount / currency / incoterms / payment_terms 从 quotation 自动同步
 *   - afterUpdate (T9.04)：status 从非 signed → signed 时自动生成 order + 定金 payment
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'contracts',
  title: '合同',
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
      name: 'contract_no',
      patterns: [
        { type: 'string', options: { value: 'CT-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: { type: 'string', title: '合同编号', 'x-component': 'Input', 'x-read-pretty': true },
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
      type: 'date',
      name: 'signed_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '签署日期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'decimal',
      name: 'total_amount',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: '合同金额',
        'x-component': 'InputNumber',
        'x-component-props': { precision: 2, min: 0 },
        description: '不填则从 quotation.total 自动同步',
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
      type: 'string',
      name: 'incoterms',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '贸易条款',
        'x-component': 'Input',
        description: '从 quotation 同步（FOB Yangon / FOB Qingdao 等）',
      },
    },
    {
      type: 'string',
      name: 'payment_terms',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '付款条款',
        'x-component': 'Input',
        description: '从 quotation 同步（tt_30_70 / tt_bl / lc 等）',
      },
    },
    {
      type: 'attachment',
      name: 'contract_file',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '合同文件',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: false },
      },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'pending',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'pending', label: '待签署', color: 'default' },
          { value: 'signed', label: '已签署', color: 'green' },
          { value: 'cancelled', label: '已作废', color: 'red' },
        ],
        description: '切换到"已签署"会自动生成订单与定金 payment',
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
