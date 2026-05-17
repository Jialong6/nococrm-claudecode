/**
 * T6.07 样品表 samples
 * Hooks（见 plugin.ts）：
 *   - beforeCreate：planned_finish_at 自动 = requested_at + 7 天（首样 1 周，来自 05 知识库）
 *   - beforeCreate：sampling_factory 默认 = CN_QD 青岛打样中心
 *   - beforeCreate：customer 从 quotation 自动同步
 *   - afterSave (T6.08)：revision_no ≥ 4 → customer.risk_flag = true
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'samples',
  title: '样品',
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
      name: 'sample_no',
      patterns: [
        { type: 'string', options: { value: 'SP-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: { type: 'string', title: '样品编号', 'x-component': 'Input', 'x-read-pretty': true },
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
      type: 'string',
      name: 'sample_type',
      defaultValue: 'first',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '样品类型',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'first', label: '首样', color: 'blue' },
          { value: 'second', label: '二次样', color: 'cyan' },
          { value: 'third', label: '三次样', color: 'gold' },
          { value: 'fourth', label: '四次样', color: 'orange' },
          { value: 'pp', label: 'PP 样（产前样）', color: 'green' },
        ],
      },
    },
    {
      type: 'integer',
      name: 'revision_no',
      defaultValue: 1,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '版本号',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1 },
        description: '≥ 4 自动将客户标记为高风险（来自 05 知识库红线）',
      },
    },
    {
      type: 'belongsTo',
      name: 'sampling_factory',
      target: 'factories',
      foreignKey: 'sampling_factory_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '打样工厂',
        'x-component': 'AssociationField',
        description: '默认青岛打样中心 CN_QD',
      },
    },
    {
      type: 'date',
      name: 'requested_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '委托日期', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'planned_finish_at',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '计划完成日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
        description: '不填则自动 = 委托日期 + 7 天（首样 1 周）',
      },
    },
    {
      type: 'date',
      name: 'actual_finish_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '实际完成日', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'date',
      name: 'shipped_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '寄出日期', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'string',
      name: 'courier',
      interface: 'input',
      uiSchema: { type: 'string', title: '快递公司', 'x-component': 'Input' },
    },
    {
      type: 'string',
      name: 'tracking_no',
      interface: 'input',
      uiSchema: { type: 'string', title: '运单号', 'x-component': 'Input' },
    },
    {
      type: 'date',
      name: 'customer_received_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '客户签收', 'x-component': 'DatePicker', 'x-component-props': { showTime: false } },
    },
    {
      type: 'text',
      name: 'customer_feedback',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '客户反馈', 'x-component': 'Input.TextArea' },
    },
    {
      type: 'text',
      name: 'revision_notes',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '修改要点',
        'x-component': 'Input.TextArea',
        description: '客户驳回时录入；二次打样基于此条目修改',
      },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'queued',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'queued', label: '排队中', color: 'default' },
          { value: 'producing', label: '制作中', color: 'gold' },
          { value: 'shipped', label: '已寄出', color: 'blue' },
          { value: 'received', label: '已收到', color: 'cyan' },
          { value: 'approved', label: '已确认', color: 'green' },
          { value: 'rejected', label: '已驳回', color: 'red' },
        ],
      },
    },
    {
      type: 'attachment',
      name: 'photos',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '样品照片',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: true },
      },
    },
  ],
});
