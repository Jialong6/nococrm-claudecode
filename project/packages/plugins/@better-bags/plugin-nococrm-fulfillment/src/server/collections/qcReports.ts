/**
 * T11.02 + T11.03 质检报告 qc_reports
 * aql_level 默认 2.5（来自 01 知识库）
 * Hook：pass=true AND is_final_internal=true → order.status='completed'
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'qc_reports',
  title: '质检报告',
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
      name: 'report_no',
      patterns: [
        { type: 'string', options: { value: 'QC-' } },
        { type: 'date', options: { format: 'YYYYMMDD' } },
        { type: 'string', options: { value: '-' } },
        { type: 'integer', options: { digits: 3, start: 1 } },
      ],
      interface: 'sequence',
      uiSchema: { type: 'string', title: '报告编号', 'x-component': 'Input', 'x-read-pretty': true },
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
      defaultValue: 'aql_internal',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '检验类型',
        'x-component': 'Radio.Group',
        required: true,
        enum: [
          { value: 'aql_internal', label: '内部 AQL 抽检', color: 'blue' },
          { value: 'customer_inspection', label: '客户验厂', color: 'gold' },
          { value: 'third_party', label: '第三方验货', color: 'cyan' },
          { value: 'metal_detect', label: 'X 线检针', color: 'purple' },
        ],
      },
    },
    {
      type: 'decimal',
      name: 'aql_level',
      defaultValue: 2.5,
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: 'AQL 等级',
        'x-component': 'InputNumber',
        'x-component-props': { precision: 2, min: 0 },
        description: '来自 01 知识库；默认 2.5',
      },
    },
    {
      type: 'belongsTo',
      name: 'inspector',
      target: 'users',
      foreignKey: 'inspector_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '检验员',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'nickname', value: 'id' } },
      },
    },
    {
      type: 'date',
      name: 'inspection_date',
      interface: 'datetime',
      uiSchema: {
        type: 'string',
        title: '检验日',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: false },
      },
    },
    {
      type: 'integer',
      name: 'sample_size',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '抽检件数', 'x-component': 'InputNumber', 'x-component-props': { min: 0 } },
    },
    {
      type: 'integer',
      name: 'defect_critical',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '致命缺陷', 'x-component': 'InputNumber', 'x-component-props': { min: 0 } },
    },
    {
      type: 'integer',
      name: 'defect_major',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '主要缺陷', 'x-component': 'InputNumber', 'x-component-props': { min: 0 } },
    },
    {
      type: 'integer',
      name: 'defect_minor',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '次要缺陷', 'x-component': 'InputNumber', 'x-component-props': { min: 0 } },
    },
    {
      type: 'boolean',
      name: 'pass',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '是否通过',
        'x-component': 'Checkbox',
        description: '与 is_final_internal 同时为 true 时触发 order.status=completed',
      },
    },
    {
      type: 'boolean',
      name: 'is_final_internal',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '最终内检',
        'x-component': 'Checkbox',
        description: '勾选表示此报告为出货前最后一次内部 QC',
      },
    },
    {
      type: 'attachment',
      name: 'report_file',
      interface: 'attachment',
      uiSchema: { type: 'array', title: '报告 PDF', 'x-component': 'Upload.Attachment' },
    },
    {
      type: 'attachment',
      name: 'photos',
      interface: 'attachment',
      uiSchema: {
        type: 'array',
        title: '缺陷照片',
        'x-component': 'Upload.Attachment',
        'x-component-props': { multiple: true },
      },
    },
    {
      type: 'boolean',
      name: 'customer_witnessed',
      defaultValue: false,
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: '客户/第三方在场',
        'x-component': 'Checkbox',
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
