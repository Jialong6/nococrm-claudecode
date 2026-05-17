/**
 * T5.05 内部核价表 cost_estimates
 *
 * 重要 ACL：业务员只读 final_price，看不到 cost / margin（T5.06 完整实现留 M15）
 * field-formula margin_value = final_price - (material_cost + labor_cost + overhead + logistics_cost)
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'cost_estimates',
  title: '核价',
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
      name: 'inquiry',
      target: 'inquiries',
      foreignKey: 'inquiry_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '询盘',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'inquiry_no', value: 'id' } },
        required: true,
      },
    },
    {
      type: 'decimal',
      name: 'material_cost',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: '物料成本',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, precision: 2 },
      },
    },
    {
      type: 'decimal',
      name: 'labor_cost',
      interface: 'number',
      uiSchema: { type: 'number', title: '人工', 'x-component': 'InputNumber', 'x-component-props': { min: 0, precision: 2 } },
    },
    {
      type: 'decimal',
      name: 'overhead',
      interface: 'number',
      uiSchema: { type: 'number', title: '间接费用', 'x-component': 'InputNumber', 'x-component-props': { min: 0, precision: 2 } },
    },
    {
      type: 'decimal',
      name: 'logistics_cost',
      interface: 'number',
      defaultValue: 0,
      uiSchema: {
        type: 'number',
        title: '物流',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, precision: 2 },
        description: 'FOB 报价可为 0；CIF 需填运保',
      },
    },
    {
      type: 'decimal',
      name: 'margin_rate',
      interface: 'percent',
      uiSchema: {
        type: 'number',
        title: '利润率',
        'x-component': 'Percent',
        'x-component-props': { precision: 2 },
      },
    },
    {
      type: 'formula',
      name: 'margin_value',
      dataType: 'decimal',
      expression:
        'final_price - (material_cost + labor_cost + overhead + logistics_cost)',
      interface: 'formula',
      uiSchema: {
        type: 'number',
        title: '利润额',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
    },
    {
      type: 'decimal',
      name: 'final_price',
      interface: 'number',
      uiSchema: {
        type: 'number',
        title: '建议报价（单价）',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, precision: 2 },
        required: true,
        description: '业务员看到的报价基准；低于此价的 quotation 需销售经理审批',
      },
    },
    {
      type: 'belongsTo',
      name: 'factory_route',
      target: 'factories',
      foreignKey: 'factory_route_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '建议工厂',
        'x-component': 'AssociationField',
        description: '基于 MOQ + 急单的路由建议',
      },
    },
    {
      type: 'belongsTo',
      name: 'approved_by',
      target: 'users',
      foreignKey: 'approved_by_id',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '审批人',
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { label: 'nickname', value: 'id' } },
      },
    },
    {
      type: 'date',
      name: 'approved_at',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '审批时间', 'x-component': 'DatePicker', 'x-component-props': { showTime: true } },
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'draft',
      interface: 'radioGroup',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Radio.Group',
        enum: [
          { value: 'draft', label: '草稿', color: 'default' },
          { value: 'approved', label: '已审批', color: 'green' },
          { value: 'rejected', label: '已驳回', color: 'red' },
          { value: 'abandoned', label: '已废弃', color: 'default' },
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
