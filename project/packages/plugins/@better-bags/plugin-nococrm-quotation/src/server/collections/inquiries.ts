/**
 * T5.01 询盘表 inquiries
 * 来源：tasks.md M5
 *
 * 完整度评分 completeness_score 由 plugin.ts 的 beforeSave hook 自动计算（T5.04）。
 * 状态机由评分驱动：需求收集中 ↔ 需求完善（< 80）→ 已交核价（≥ 80）
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'inquiries',
  title: '询盘',
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
      name: 'inquiry_no',
      patterns: [
        { type: 'string', options: { value: 'INQ-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: {
        type: 'string',
        title: '询盘编号',
        'x-component': 'Input',
        'x-read-pretty': true,
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
        required: true,
      },
    },
    {
      type: 'belongsTo',
      name: 'product_category',
      target: 'product_categories',
      foreignKey: 'product_category_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '产品分类',
        'x-component': 'AssociationField',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'product_name',
      interface: 'input',
      uiSchema: { type: 'string', title: '产品名', 'x-component': 'Input' },
    },
    {
      type: 'attachment',
      name: 'sketch_url',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '设计稿',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: true },
      },
    },
    {
      type: 'attachment',
      name: 'spec_doc',
      interface: 'attachment',
      uiSchema: { type: 'array', title: '规格书', 'x-component': 'Upload.Attachment' },
    },
    {
      type: 'boolean',
      name: 'sample_provided',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '客户提供原样',
        'x-component': 'Checkbox',
        description: '是否有客户实物原样作为打样参考',
      },
    },
    {
      type: 'integer',
      name: 'quantity',
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '数量',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1 },
        description: '缅甸大货 MOQ 1500 起；少于 1500 自动路由日照',
      },
    },
    {
      type: 'string',
      name: 'material',
      interface: 'input',
      uiSchema: { type: 'string', title: '主面料', 'x-component': 'Input' },
    },
    {
      type: 'text',
      name: 'accessories',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '辅料/五金', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'string',
      name: 'color',
      interface: 'input',
      uiSchema: { type: 'string', title: '颜色', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'season',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '季节',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'ss', label: '春夏' },
          { value: 'fw', label: '秋冬' },
          { value: 'all', label: '全季' },
          { value: 'limited', label: '限定' },
        ],
      },
    },
    {
      type: 'decimal',
      name: 'target_price',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: '目标单价',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, precision: 2 },
      },
    },
    {
      type: 'belongsTo',
      name: 'target_currency',
      target: 'currencies_dict',
      foreignKey: 'target_currency_code',
      targetKey: 'code',
      interface: 'm2o',
      uiSchema: { type: 'object', title: '币种', 'x-component': 'AssociationField' },
    },
    {
      type: 'date',
      name: 'delivery_request',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '期望交期',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'boolean',
      name: 'is_urgent',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '急单',
        'x-component': 'Checkbox',
        description: '勾选后自动路由山东日照工厂（≤ 30 天交期）',
      },
    },
    {
      type: 'integer',
      name: 'completeness_score',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '完整度评分',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
        description: '0-100，由系统自动评分；< 80 → 需求完善；≥ 80 → 已交核价',
      },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'collecting',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'collecting', label: '需求收集中', color: 'default' },
          { value: 'refining', label: '需求完善', color: 'gold' },
          { value: 'costing', label: '已交核价', color: 'cyan' },
          { value: 'quoted', label: '已报价', color: 'green' },
          { value: 'abandoned', label: '已废弃', color: 'red' },
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
